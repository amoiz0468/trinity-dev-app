from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Avg, Q, Max, DecimalField, ProtectedError
from django.db.models.functions import Coalesce
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Customer, Notification
from .serializers import (
    CustomerSerializer,
    CustomerCreateSerializer,
    CustomerPurchaseHistorySerializer,
    CustomerRegistrationSerializer,
    UserSerializer,
    EmailOrUsernameTokenObtainPairSerializer,
    NotificationSerializer,
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
        annotated_queryset = Customer.objects.select_related('user').annotate(
            order_count=Count('invoices', distinct=True),
            total_spent=Coalesce(
                Sum('invoices__total_amount', filter=Q(invoices__status='paid')),
                0,
                output_field=DecimalField(max_digits=10, decimal_places=2),
            ),
            last_order_date=Max('invoices__created_at'),
        )

        if self.request.user.is_staff:
            return annotated_queryset
        return annotated_queryset.filter(user=self.request.user)

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

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"detail": "Cannot delete this user because they have existing orders. This would affect revenue calculations and purchase history."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
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
        user = request.user
        customer = Customer.objects.filter(user=user).first()
        
        # 1. Update User fields directly
        user_fields_to_update = []
        if 'email' in request.data:
            new_email = request.data['email']
            if User.objects.exclude(id=user.id).filter(Q(username=new_email) | Q(email=new_email)).exists():
                return Response({'detail': 'Email is already in use.'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
            user.username = new_email
            user_fields_to_update.extend(['email', 'username'])
        
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
            user_fields_to_update.append('first_name')
            
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
            user_fields_to_update.append('last_name')
            
        if user_fields_to_update:
            user.save(update_fields=user_fields_to_update)
            
        # 2. Update Customer if it exists
        if customer:
            serializer = CustomerCreateSerializer(customer, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
        return Response({
            'user': UserSerializer(user).data,
            'customer': CustomerSerializer(customer).data if customer else None,
        })

    def put(self, request):
        user = request.user
        customer = Customer.objects.filter(user=user).first()
        
        # 1. Update User fields
        user_fields_to_update = []
        if 'email' in request.data:
            new_email = request.data['email']
            if User.objects.exclude(id=user.id).filter(Q(username=new_email) | Q(email=new_email)).exists():
                return Response({'detail': 'Email is already in use.'}, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
            user.username = new_email
            user_fields_to_update.extend(['email', 'username'])
        
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
            user_fields_to_update.append('first_name')
            
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
            user_fields_to_update.append('last_name')
            
        if user_fields_to_update:
            user.save(update_fields=user_fields_to_update)
            
        # 2. Update Customer if it exists
        if customer:
            serializer = CustomerCreateSerializer(customer, data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
        return Response({
            'user': UserSerializer(user).data,
            'customer': CustomerSerializer(customer).data if customer else None,
        })


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    JWT login endpoint supporting email or username.
    """
    serializer_class = EmailOrUsernameTokenObtainPairSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user notifications.
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users see their own and global (user=null) notifications
        # Admins see all
        if self.request.user.is_staff:
            return Notification.objects.all()
        return Notification.objects.filter(
            Q(user=self.request.user) | Q(user__isnull=True)
        ).order_by('-created_at')

    @action(detail=True, methods=['patch'])
    def read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['patch'])
    def read_all(self, request):
        """Mark all visible notifications as read"""
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})
