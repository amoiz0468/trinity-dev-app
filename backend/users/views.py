from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Avg
from .models import Customer
from .serializers import (
    CustomerSerializer,
    CustomerCreateSerializer,
    CustomerPurchaseHistorySerializer,
    CustomerRegistrationSerializer,
    UserSerializer
)


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Customer/User CRUD operations.
    
    Manage customer database with full CRUD functionality, view purchase history,
    track spending patterns, and analyze customer behavior.
    
    **Features:**
    - Create and manage customer records
    - View complete purchase history
    - Track total spending and average order value
    - Get last purchase date and statistics
    - Search and filter customers
    """
    queryset = Customer.objects.all()
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Customer.objects.all()
        return Customer.objects.filter(user=self.request.user)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CustomerCreateSerializer
        elif self.action == 'history':
            return CustomerPurchaseHistorySerializer
        elif self.action in ['update', 'partial_update']:
            return CustomerCreateSerializer
        return CustomerSerializer
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """
        Get customer purchase history with complete statistics.
        
        **Returns:**
        - total_purchases: Total number of invoices
        - total_spent: Sum of all paid invoices
        - average_order_value: Average spending per order
        - last_purchase_date: Date of most recent purchase
        - invoices: List of all customer invoices
        """
        customer = self.get_object()
        invoices = customer.invoices.all()
        
        # Calculate statistics
        total_purchases = invoices.count()
        total_spent = invoices.filter(status='paid').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        avg_order = invoices.filter(status='paid').aggregate(
            avg=Avg('total_amount')
        )['avg'] or 0
        
        last_purchase = invoices.order_by('-created_at').first()
        
        history_data = {
            'total_purchases': total_purchases,
            'total_spent': total_spent,
            'average_order_value': avg_order,
            'last_purchase_date': last_purchase.created_at if last_purchase else None,
            'invoices': [
                {
                    'id': inv.id,
                    'invoice_number': inv.invoice_number,
                    'total_amount': inv.total_amount,
                    'status': inv.status,
                    'created_at': inv.created_at,
                }
                for inv in invoices
            ]
        }
        
        serializer = CustomerPurchaseHistorySerializer(history_data)
        return Response(serializer.data)


class RegisterView(APIView):
    """
    Customer self-registration endpoint.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        customer = serializer.save()
        return Response(CustomerSerializer(customer).data, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    """
    Get or update the current user's customer profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        customer = Customer.objects.filter(user=user).first()
        return Response({
            'user': UserSerializer(user).data,
            'customer': CustomerSerializer(customer).data if customer else None,
        })

    def patch(self, request):
        customer = Customer.objects.filter(user=request.user).first()
        if not customer:
            return Response({'detail': 'Customer profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CustomerCreateSerializer(customer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data.get('email')
        if new_email and User.objects.exclude(id=request.user.id).filter(username=new_email).exists():
            return Response({'detail': 'Email is already in use.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        if 'email' in serializer.validated_data:
            request.user.email = serializer.validated_data['email']
            request.user.username = serializer.validated_data['email']
            request.user.save(update_fields=['email', 'username'])
        return Response(CustomerSerializer(customer).data)

    def put(self, request):
        customer = Customer.objects.filter(user=request.user).first()
        if not customer:
            return Response({'detail': 'Customer profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = CustomerCreateSerializer(customer, data=request.data)
        serializer.is_valid(raise_exception=True)
        new_email = serializer.validated_data.get('email')
        if new_email and User.objects.exclude(id=request.user.id).filter(username=new_email).exists():
            return Response({'detail': 'Email is already in use.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        if 'email' in serializer.validated_data:
            request.user.email = serializer.validated_data['email']
            request.user.username = serializer.validated_data['email']
            request.user.save(update_fields=['email', 'username'])
        return Response(CustomerSerializer(customer).data)
