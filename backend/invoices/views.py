from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.utils import timezone
from django.conf import settings
from django.http import HttpResponse
import requests
from requests import RequestException
from users.models import Customer
from .models import Invoice, InvoiceItem, Cart, CartItem
from .serializers import (
    InvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceListSerializer,
    InvoiceItemSerializer,
    CartSerializer,
    CartItemSerializer,
    CartItemCreateSerializer
)


def get_paypal_access_token():
    auth = (settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET)
    response = requests.post(
        f"{settings.PAYPAL_BASE_URL}/v1/oauth2/token",
        data={'grant_type': 'client_credentials'},
        auth=auth,
        timeout=15,
    )
    response.raise_for_status()
    return response.json().get('access_token')


def build_paypal_error_response(exc: RequestException, fallback_message: str):
    response = getattr(exc, 'response', None)
    if response is None:
        return Response(
            {'detail': f'{fallback_message}: {str(exc)}'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    raw_status = response.status_code
    if raw_status in (400, 404, 409, 422):
        status_code = raw_status
    elif raw_status in (401, 403):
        # Avoid colliding with app-auth 401 handling on frontend.
        status_code = status.HTTP_502_BAD_GATEWAY
    elif 400 <= raw_status < 500:
        status_code = status.HTTP_400_BAD_REQUEST
    else:
        status_code = status.HTTP_502_BAD_GATEWAY
    detail = None
    paypal_payload = None

    try:
        payload = response.json()
        if isinstance(payload, dict):
            details = payload.get('details') or []
            first_detail = details[0] if isinstance(details, list) and details else {}
            issue = first_detail.get('issue') if isinstance(first_detail, dict) else None
            description = first_detail.get('description') if isinstance(first_detail, dict) else None
            message = payload.get('message') or payload.get('error_description') or payload.get('error')
            detail = description or message or issue
            paypal_payload = {
                'name': payload.get('name'),
                'message': payload.get('message'),
                'issue': issue,
                'description': description,
                'debug_id': payload.get('debug_id'),
            }
    except ValueError:
        body = (response.text or '').strip()
        detail = body[:500] if body else None

    return Response(
        {
            'detail': detail or f'{fallback_message}.',
            'paypal_status': raw_status,
            'paypal': paypal_payload,
        },
        status=status_code,
    )


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Invoice management.
    
    Create, retrieve, update, and manage invoices with full control over
    invoice items, payment status, and payment methods.
    
    **Features:**
    - Create new invoices with multiple items
    - Track invoice status (pending, paid, cancelled, refunded)
    - Support multiple payment methods (cash, card, PayPal, other)
    - Calculate tax and totals automatically
    - Filter by status, payment method, and customer
    - Search by invoice number or customer name
    - Sort by creation date or total amount
    
    **Status Options:** pending, processing, paid, cancelled, refunded
    **Payment Methods:** cash, card, paypal, other
    """
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'payment_method', 'customer']
    search_fields = ['invoice_number', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        if self.request.user.is_staff:
            qs = Invoice.objects.all()
        else:
            customer = Customer.objects.filter(user=self.request.user).first()
            if not customer:
                return Invoice.objects.none()
            qs = Invoice.objects.filter(customer=customer)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.lower())

        payment_method_param = self.request.query_params.get('payment_method')
        if payment_method_param:
            qs = qs.filter(payment_method=payment_method_param.lower())

        customer_param = self.request.query_params.get('customer')
        if customer_param:
            qs = qs.filter(customer_id=customer_param)

        return qs

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        if not request.data.get('customer'):
            customer = Customer.objects.filter(user=request.user).first()
            if not customer:
                return Response(
                    {'detail': 'Customer profile not found. Please ensure you have a profile or provide a customer ID.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            payload = request.data.copy()
            payload['customer'] = customer.id
        else:
            payload = request.data

        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()

        if not request.user.is_staff and invoice.payment_method in ['card', 'cash', 'other']:
            invoice.status = 'paid'
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=['status', 'paid_at'])
        # Return full invoice payload (with `id`) for frontend order/payment flow.
        response_serializer = InvoiceSerializer(
            invoice,
            context=self.get_serializer_context()
        )
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        invoice = serializer.save()
        if invoice.status == 'paid' and not invoice.paid_at:
            invoice.paid_at = timezone.now()
            invoice.save(update_fields=['paid_at'])
        elif invoice.status != 'paid' and invoice.paid_at:
            invoice.paid_at = None
            invoice.save(update_fields=['paid_at'])
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        elif self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def _to_frontend_status(self, backend_status):
        status_map = {
            'pending': 'PENDING',
            'processing': 'PROCESSING',
            'paid': 'COMPLETED',
            'cancelled': 'CANCELLED',
            'refunded': 'CANCELLED',
        }
        return status_map.get((backend_status or '').lower(), 'PENDING')

    def _to_backend_status(self, incoming_status):
        raw_status = str(incoming_status or '').strip().lower()
        status_map = {
            'pending': 'pending',
            'processing': 'processing',
            'completed': 'paid',
            'paid': 'paid',
            'cancelled': 'cancelled',
            'refunded': 'refunded',
        }
        return status_map.get(raw_status, None)

    def _to_order_payload(self, invoice):
        items = []
        for item in invoice.items.select_related('product__category').all():
            product = item.product
            items.append({
                'product': {
                    'id': str(product.id),
                    'name': item.product_name or product.name,
                    'brand': item.product_brand or product.brand,
                    'price': float(item.unit_price),
                    'stock': product.quantity_in_stock,
                    'imageUrl': product.picture_url or '',
                    'barcode': product.barcode or '',
                    'category': product.category.name if product.category else '',
                },
                'quantity': item.quantity,
            })

        return {
            'id': str(invoice.id),
            'userId': str(invoice.customer_id),
            'items': items,
            'totalAmount': float(invoice.total_amount),
            'billingInfo': {
                'firstName': invoice.billing_first_name or invoice.customer.first_name,
                'lastName': invoice.billing_last_name or invoice.customer.last_name,
                'address': invoice.billing_address,
                'zipCode': invoice.billing_zip_code,
                'city': invoice.billing_city,
                'email': invoice.paypal_payer_email or invoice.customer.email,
            },
            'paymentMethod': invoice.payment_method,
            'status': self._to_frontend_status(invoice.status),
            'createdAt': invoice.created_at.isoformat(),
        }

    @action(detail=False, methods=['get'])
    def history(self, request):
        """
        List invoice history in frontend order format.
        Supports limit/offset pagination expected by the mobile app.
        """
        try:
            limit = int(request.query_params.get('limit', 20))
            offset = int(request.query_params.get('offset', 0))
        except (TypeError, ValueError):
            return Response(
                {'detail': 'limit and offset must be integers.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if limit < 1:
            limit = 20
        limit = min(limit, 100)
        if offset < 0:
            offset = 0

        queryset = self.get_queryset().select_related('customer').prefetch_related('items__product__category')
        total_count = queryset.count()
        invoices = queryset[offset:offset + limit]
        results = [self._to_order_payload(invoice) for invoice in invoices]

        return Response({
            'count': total_count,
            'limit': limit,
            'offset': offset,
            'results': results,
        })

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        """
        Update invoice status using frontend or backend status values.
        """
        invoice = self.get_object()
        incoming_status = request.data.get('status')
        backend_status = self._to_backend_status(incoming_status)

        if not backend_status:
            return Response(
                {'detail': 'Invalid status value.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice.status = backend_status
        if backend_status == 'paid':
            invoice.paid_at = timezone.now()
            invoice.payment_method = invoice.payment_method or 'paypal'
            invoice.save(update_fields=['status', 'paid_at', 'payment_method'])
        elif backend_status in ['pending', 'processing', 'cancelled']:
            invoice.paid_at = None
            invoice.save(update_fields=['status', 'paid_at'])
        else:
            invoice.save(update_fields=['status'])

        invoice.refresh_from_db()
        return Response(self._to_order_payload(invoice))

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel invoice.
        - pending/processing -> cancelled
        - paid -> refunded
        """
        invoice = self.get_object()

        if invoice.status == 'cancelled':
            return Response(self._to_order_payload(invoice))

        if invoice.status == 'paid':
            invoice.status = 'refunded'
            invoice.save(update_fields=['status'])
        else:
            invoice.status = 'cancelled'
            invoice.paid_at = None
            invoice.save(update_fields=['status', 'paid_at'])

        invoice.refresh_from_db()
        return Response(self._to_order_payload(invoice))

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """
        Lightweight receipt endpoint consumed by mobile app.
        """
        invoice = self.get_object()
        receipt_url = request.build_absolute_uri(f"/api/invoices/{invoice.id}/")
        return Response({
            'receiptUrl': receipt_url,
            'invoiceNumber': invoice.invoice_number,
            'status': invoice.status,
            'totalAmount': float(invoice.total_amount),
        })

    @action(detail=True, methods=['post'], url_path='send-receipt')
    def send_receipt(self, request, pk=None):
        """
        Placeholder endpoint for receipt email dispatch.
        """
        invoice = self.get_object()
        target_email = (
            request.data.get('email')
            or invoice.paypal_payer_email
            or invoice.customer.email
        )
        if not target_email:
            return Response(
                {'detail': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Email delivery service is not integrated yet, but this preserves API contract.
        return Response({
            'success': True,
            'message': f'Receipt queued for {target_email}.',
        })

    @action(detail=True, methods=['post'])
    def create_paypal_order(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == 'paid':
            return Response({'detail': 'Invoice already paid.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = get_paypal_access_token()
            return_url = request.build_absolute_uri("/api/paypal/return/")
            cancel_url = request.build_absolute_uri("/api/paypal/cancel/")
            payload = {
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "reference_id": invoice.invoice_number,
                        "custom_id": str(invoice.id),
                        "amount": {
                            "currency_code": "EUR",
                            "value": f"{invoice.total_amount:.2f}"
                        },
                        "description": f"Invoice {invoice.invoice_number}"
                    }
                ],
                "payment_source": {
                    "paypal": {
                        "experience_context": {
                            "landing_page": "LOGIN",
                            "shipping_preference": "NO_SHIPPING",
                            "user_action": "PAY_NOW",
                            "return_url": return_url,
                            "cancel_url": cancel_url,
                        }
                    }
                },
            }

            response = requests.post(
                f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders",
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()
            links = data.get('links') or []
            approval_link = next(
                (
                    link.get('href')
                    for link in links
                    if (link.get('rel') or '').lower() in ['approve', 'payer-action']
                ),
                ''
            )
            if not approval_link and data.get('id'):
                checkout_host = 'https://www.sandbox.paypal.com'
                if 'sandbox' not in (settings.PAYPAL_BASE_URL or '').lower():
                    checkout_host = 'https://www.paypal.com'
                approval_link = f"{checkout_host}/checkoutnow?token={data.get('id')}"
            if approval_link:
                data['approval_url'] = approval_link

            invoice.payment_method = 'paypal'
            invoice.status = 'pending'
            invoice.paypal_transaction_id = data.get('id', '')
            invoice.save(update_fields=['payment_method', 'status', 'paypal_transaction_id'])

            return Response(data, status=status.HTTP_200_OK)
        except RequestException as exc:
            return build_paypal_error_response(exc, 'PayPal order creation failed')

    @action(detail=True, methods=['post'])
    def capture_paypal_order(self, request, pk=None):
        invoice = self.get_object()
        order_id = request.data.get('order_id') or invoice.paypal_transaction_id
        if not order_id:
            return Response({'detail': 'PayPal order id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = get_paypal_access_token()
            capture_url = f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture"
            response = requests.post(
                capture_url,
                json={},
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
                timeout=15,
            )

            # Sandbox sometimes rejects the explicit empty JSON payload.
            # Retry with an empty body when that specific validation error occurs.
            if (
                response.status_code in (400, 422)
                and 'payload is not supported' in (response.text or '').lower()
            ):
                response = requests.post(
                    capture_url,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Prefer": "return=representation",
                    },
                    timeout=15,
                )

            response.raise_for_status()
            data = response.json()

            payer = data.get('payer', {})
            payer_email = payer.get('email_address', '')

            invoice.status = 'paid'
            invoice.paid_at = timezone.now()
            invoice.paypal_transaction_id = order_id
            invoice.paypal_payer_email = payer_email
            invoice.save(update_fields=['status', 'paid_at', 'paypal_transaction_id', 'paypal_payer_email'])

            return Response(data, status=status.HTTP_200_OK)
        except RequestException as exc:
            return build_paypal_error_response(exc, 'PayPal order capture failed')


class InvoiceItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing Invoice Items (read-only).
    
    View individual line items within invoices. Items are created/updated
    through the Invoice endpoint.
    
    **Properties:**
    - product: Product information
    - quantity: Number of units
    - unit_price: Price per unit
    - total_price: Calculated total (quantity × unit_price)
    """
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return InvoiceItem.objects.all()
        customer = Customer.objects.filter(user=self.request.user).first()
        if not customer:
            return InvoiceItem.objects.none()
        return InvoiceItem.objects.filter(invoice__customer=customer)


class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def _get_customer(self, request):
        return Customer.objects.filter(user=request.user).first()

    def _get_or_create_cart(self, customer):
        cart, _ = Cart.objects.get_or_create(customer=customer)
        return cart

    def list(self, request):
        customer = self._get_customer(request)
        if not customer:
            return Response({'detail': 'Customer profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
        cart = self._get_or_create_cart(customer)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        customer = self._get_customer(request)
        if not customer:
            return Response({'detail': 'Customer profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
        cart = self._get_or_create_cart(customer)
        serializer = CartItemCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        if product.quantity_in_stock < quantity:
            return Response({'detail': 'Insufficient stock.'}, status=status.HTTP_400_BAD_REQUEST)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={
                'quantity': quantity,
                'unit_price': product.current_price,
                'total_price': product.current_price * quantity,
            }
        )

        if not created:
            item.quantity += quantity
            item.unit_price = product.current_price
            item.save()

        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['patch'])
    def update_item(self, request):
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity')
        if item_id is None or quantity is None:
            return Response({'detail': 'item_id and quantity are required.'}, status=status.HTTP_400_BAD_REQUEST)

        customer = self._get_customer(request)
        if not customer:
            return Response({'detail': 'Customer profile not found.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            item = CartItem.objects.select_related('product', 'cart').get(id=item_id, cart__customer=customer)
        except CartItem.DoesNotExist:
            return Response({'detail': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

        quantity = int(quantity)
        if quantity < 1:
            return Response({'detail': 'Quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

        if item.product.quantity_in_stock < quantity:
            return Response({'detail': 'Insufficient stock.'}, status=status.HTTP_400_BAD_REQUEST)

        item.quantity = quantity
        item.unit_price = item.product.current_price
        item.save()
        return Response(CartItemSerializer(item).data)

    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        item_id = request.data.get('item_id')
        if item_id is None:
            return Response({'detail': 'item_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        customer = self._get_customer(request)
        if not customer:
            return Response({'detail': 'Customer profile not found.'}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = CartItem.objects.filter(id=item_id, cart__customer=customer).delete()
        if not deleted:
            return Response({'detail': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        customer = self._get_customer(request)
        if not customer:
            return Response({'detail': 'Customer profile not found.'}, status=status.HTTP_400_BAD_REQUEST)
        CartItem.objects.filter(cart__customer=customer).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PaymentBaseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_customer(self, request):
        return Customer.objects.filter(user=request.user).first()

    def _invoice_queryset_for_request(self, request):
        if request.user.is_staff:
            return Invoice.objects.select_related('customer')
        customer = self._get_customer(request)
        if not customer:
            return Invoice.objects.none()
        return Invoice.objects.select_related('customer').filter(customer=customer)

    def _api_success(self, data=None, message=None):
        payload = {'success': True}
        if data is not None:
            payload['data'] = data
        if message:
            payload['message'] = message
        return payload

    def _api_error(self, error, message=None):
        payload = {'success': False, 'error': error}
        if message:
            payload['message'] = message
        return payload


class PaymentVerifyView(PaymentBaseAPIView):
    """
    Verify a payment transaction by transaction id.
    """
    def get(self, request, transaction_id):
        invoice = self._invoice_queryset_for_request(request).filter(
            paypal_transaction_id=transaction_id
        ).first()
        if not invoice:
            return Response(
                self._api_error('Transaction not found'),
                status=status.HTTP_404_NOT_FOUND
            )

        verified = invoice.status == 'paid'
        return Response(self._api_success({
            'verified': verified,
            'transactionId': transaction_id,
            'invoiceId': str(invoice.id),
            'status': invoice.status,
            'paidAt': invoice.paid_at.isoformat() if invoice.paid_at else None,
        }))


class PaymentProcessView(PaymentBaseAPIView):
    """
    Process a direct payment for an order/invoice.
    """
    def post(self, request):
        order_id = request.data.get('orderId')
        if not order_id:
            return Response(
                self._api_error('orderId is required'),
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice = self._invoice_queryset_for_request(request).filter(id=order_id).first()
        if not invoice:
            return Response(
                self._api_error('Order not found'),
                status=status.HTTP_404_NOT_FOUND
            )

        # Keep process endpoint idempotent for already-settled payments
        if invoice.status == 'paid':
            existing_tx = invoice.paypal_transaction_id or f"INV-{invoice.id}"
            return Response(self._api_success({
                'success': True,
                'transactionId': existing_tx,
                'message': 'Payment already processed',
                'invoiceId': str(invoice.id),
            }))

        payment_method = str(request.data.get('paymentMethod') or 'other').lower()
        if payment_method not in ['cash', 'card', 'paypal', 'other']:
            payment_method = 'other'

        payment_details = request.data.get('paymentDetails') or {}
        transaction_id = (
            payment_details.get('transactionId')
            or payment_details.get('order_id')
            or payment_details.get('orderId')
            or f"PAY-{invoice.id}-{int(timezone.now().timestamp())}"
        )

        payer_email = payment_details.get('payerEmail') or payment_details.get('email')
        update_fields = ['status', 'payment_method', 'paid_at']
        invoice.status = 'paid'
        invoice.payment_method = payment_method
        invoice.paid_at = timezone.now()

        if transaction_id:
            invoice.paypal_transaction_id = str(transaction_id)
            update_fields.append('paypal_transaction_id')
        if payer_email:
            invoice.paypal_payer_email = payer_email
            update_fields.append('paypal_payer_email')

        invoice.save(update_fields=update_fields)

        return Response(self._api_success({
            'success': True,
            'transactionId': invoice.paypal_transaction_id or transaction_id,
            'message': 'Payment processed successfully',
            'invoiceId': str(invoice.id),
        }))


class PaymentRefundView(PaymentBaseAPIView):
    """
    Refund a payment transaction.
    """
    def post(self, request):
        transaction_id = request.data.get('transactionId')
        amount = request.data.get('amount')
        reason = request.data.get('reason', '')

        if not transaction_id:
            return Response(
                self._api_error('transactionId is required'),
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice = self._invoice_queryset_for_request(request).filter(
            paypal_transaction_id=transaction_id
        ).first()
        if not invoice:
            return Response(
                self._api_error('Transaction not found'),
                status=status.HTTP_404_NOT_FOUND
            )

        if invoice.status == 'refunded':
            return Response(self._api_success({
                'success': True,
                'refundId': f"RFND-{invoice.id}",
                'message': 'Refund already processed',
                'invoiceId': str(invoice.id),
            }))

        if invoice.status not in ['paid', 'pending']:
            return Response(
                self._api_error('Invoice cannot be refunded in current status'),
                status=status.HTTP_400_BAD_REQUEST
            )

        # Keep an audit trail in notes until a dedicated refunds model exists.
        note_parts = [f"Refund requested at {timezone.now().isoformat()}"]
        if amount is not None:
            note_parts.append(f"amount={amount}")
        if reason:
            note_parts.append(f"reason={reason}")
        invoice.notes = (invoice.notes + "\n" if invoice.notes else "") + " | ".join(note_parts)

        invoice.status = 'refunded' if invoice.status == 'paid' else 'cancelled'
        invoice.save(update_fields=['status', 'notes'])

        return Response(self._api_success({
            'success': True,
            'refundId': f"RFND-{invoice.id}-{int(timezone.now().timestamp())}",
            'message': 'Refund processed successfully',
            'invoiceId': str(invoice.id),
        }))


class PayPalWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if not settings.PAYPAL_WEBHOOK_ID:
            return Response({'detail': 'PayPal webhook not configured.'}, status=status.HTTP_400_BAD_REQUEST)

        headers = request.headers
        try:
            token = get_paypal_access_token()
        except RequestException as exc:
            return Response({'detail': f'PayPal token error: {str(exc)}'}, status=status.HTTP_502_BAD_GATEWAY)
        payload = {
            "auth_algo": headers.get('PayPal-Auth-Algo'),
            "cert_url": headers.get('PayPal-Cert-Url'),
            "transmission_id": headers.get('PayPal-Transmission-Id'),
            "transmission_sig": headers.get('PayPal-Transmission-Sig'),
            "transmission_time": headers.get('PayPal-Transmission-Time'),
            "webhook_id": settings.PAYPAL_WEBHOOK_ID,
            "webhook_event": request.data,
        }

        try:
            verify = requests.post(
                f"{settings.PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature",
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
                timeout=15,
            )
            verify.raise_for_status()
            verification = verify.json()
        except RequestException as exc:
            return Response({'detail': f'PayPal verification failed: {str(exc)}'}, status=status.HTTP_502_BAD_GATEWAY)

        if verification.get('verification_status') != 'SUCCESS':
            return Response({'detail': 'Invalid signature.'}, status=status.HTTP_400_BAD_REQUEST)

        event_type = request.data.get('event_type')
        resource = request.data.get('resource', {})
        custom_id = None

        if event_type in ['PAYMENT.CAPTURE.COMPLETED', 'CHECKOUT.ORDER.APPROVED']:
            if 'purchase_units' in resource and resource['purchase_units']:
                custom_id = resource['purchase_units'][0].get('custom_id')
            if not custom_id:
                custom_id = resource.get('custom_id')

        if custom_id:
            try:
                invoice = Invoice.objects.get(id=custom_id)
                invoice.status = 'paid'
                invoice.paid_at = timezone.now()
                invoice.paypal_transaction_id = resource.get('id', invoice.paypal_transaction_id)
                payer = resource.get('payer', {})
                invoice.paypal_payer_email = payer.get('email_address', invoice.paypal_payer_email)
                invoice.save(update_fields=['status', 'paid_at', 'paypal_transaction_id', 'paypal_payer_email'])
            except Invoice.DoesNotExist:
                pass

        return Response({'status': 'ok'})


class PayPalReturnView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        token = request.query_params.get('token', '')
        payer_id = request.query_params.get('PayerID', '')
        html = f"""
        <!doctype html>
        <html>
          <head><meta charset="utf-8"><title>Payment Approved</title></head>
          <body style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>Payment approved on PayPal</h2>
            <p>You can return to the app and tap <strong>I Approved Payment</strong>.</p>
            <p style="color:#666; font-size: 12px;">token={token} payer={payer_id}</p>
          </body>
        </html>
        """
        return HttpResponse(html)


class PayPalCancelView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        html = """
        <!doctype html>
        <html>
          <head><meta charset="utf-8"><title>Payment Cancelled</title></head>
          <body style="font-family: Arial, sans-serif; padding: 24px;">
            <h2>Payment cancelled on PayPal</h2>
            <p>You can return to the app and try again.</p>
          </body>
        </html>
        """
        return HttpResponse(html)
