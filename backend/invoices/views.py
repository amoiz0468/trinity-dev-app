from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.utils import timezone
from django.conf import settings
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
    
    **Status Options:** pending, paid, cancelled, refunded
    **Payment Methods:** cash, card, paypal, other
    """
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['status', 'payment_method', 'customer']
    search_fields = ['invoice_number', 'customer__first_name', 'customer__last_name']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        if self.request.user.is_staff:
            return Invoice.objects.all()
        customer = Customer.objects.filter(user=self.request.user).first()
        if not customer:
            return Invoice.objects.none()
        return Invoice.objects.filter(customer=customer)

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            customer = Customer.objects.filter(user=request.user).first()
            if not customer:
                return Response(
                    {'detail': 'Customer profile not found.'},
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
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

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

    @action(detail=True, methods=['post'])
    def create_paypal_order(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == 'paid':
            return Response({'detail': 'Invoice already paid.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = get_paypal_access_token()
            payload = {
                "intent": "CAPTURE",
                "purchase_units": [
                    {
                        "reference_id": invoice.invoice_number,
                        "custom_id": str(invoice.id),
                        "amount": {
                            "currency_code": "EUR",
                            "value": str(invoice.total_amount)
                        },
                        "description": f"Invoice {invoice.invoice_number}"
                    }
                ]
            }

            response = requests.post(
                f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders",
                json=payload,
                headers={"Authorization": f"Bearer {token}"},
                timeout=15,
            )
            response.raise_for_status()
            data = response.json()

            invoice.payment_method = 'paypal'
            invoice.status = 'pending'
            invoice.paypal_transaction_id = data.get('id', '')
            invoice.save(update_fields=['payment_method', 'status', 'paypal_transaction_id'])

            return Response(data, status=status.HTTP_200_OK)
        except RequestException as exc:
            return Response({'detail': f'PayPal request failed: {str(exc)}'}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=True, methods=['post'])
    def capture_paypal_order(self, request, pk=None):
        invoice = self.get_object()
        order_id = request.data.get('order_id') or invoice.paypal_transaction_id
        if not order_id:
            return Response({'detail': 'PayPal order id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = get_paypal_access_token()
            response = requests.post(
                f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}/capture",
                headers={"Authorization": f"Bearer {token}"},
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
            return Response({'detail': f'PayPal request failed: {str(exc)}'}, status=status.HTTP_502_BAD_GATEWAY)


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
                'unit_price': product.price,
                'total_price': product.price * quantity,
            }
        )

        if not created:
            item.quantity += quantity
            item.unit_price = product.price
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
        item.unit_price = item.product.price
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
