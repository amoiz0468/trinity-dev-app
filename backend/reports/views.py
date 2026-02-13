from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum, Count, Avg, F, Q
from django.utils import timezone
from datetime import timedelta
from invoices.models import Invoice, InvoiceItem
from products.models import Product
from users.models import Customer


class ReportsView(APIView):
    """
    API View for generating KPI reports.
    Implements 5+ Key Performance Indicators.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """
        Generate comprehensive KPI report.
        """
        # Date range (default: last 30 days)
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Filter paid invoices within date range
        invoices = Invoice.objects.filter(
            status='paid',
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # KPI 1: Total Revenue
        total_revenue = invoices.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # KPI 2: Average Order Value (AOV)
        avg_order_value = invoices.aggregate(avg=Avg('total_amount'))['avg'] or 0
        
        # KPI 3: Total Orders Count
        total_orders = invoices.count()
        
        # KPI 4: Total Customers (unique)
        total_customers = invoices.values('customer').distinct().count()
        
        # KPI 5: Top Selling Products
        top_products = (
            InvoiceItem.objects.filter(invoice__in=invoices)
            .values('product__name', 'product__id')
            .annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('total_price')
            )
            .order_by('-total_quantity')[:10]
        )
        
        # KPI 6: Low Stock Products (Bonus)
        low_stock_products = Product.objects.filter(
            quantity_in_stock__lt=10,
            quantity_in_stock__gt=0,
            is_active=True
        ).values('id', 'name', 'quantity_in_stock')[:10]
        
        # KPI 7: Customer Lifetime Value (Top Customers)
        top_customers = (
            Customer.objects.annotate(
                total_spent=Sum('invoices__total_amount', filter=Q(invoices__status='paid')),
                order_count=Count('invoices', filter=Q(invoices__status='paid'))
            )
            .filter(total_spent__isnull=False)
            .order_by('-total_spent')[:10]
            .values('id', 'first_name', 'last_name', 'total_spent', 'order_count')
        )
        
        # KPI 8: Revenue Trend (Daily breakdown)
        revenue_trend = []
        for i in range(days):
            day_start = start_date + timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            
            daily_revenue = invoices.filter(
                created_at__gte=day_start,
                created_at__lt=day_end
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            
            revenue_trend.append({
                'date': day_start.date(),
                'revenue': float(daily_revenue)
            })
        
        # Product Category Performance
        category_performance = (
            InvoiceItem.objects.filter(invoice__in=invoices)
            .values('product__category__name')
            .annotate(
                total_revenue=Sum('total_price'),
                total_quantity=Sum('quantity')
            )
            .order_by('-total_revenue')
        )
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'days': days
            },
            'kpis': {
                'total_revenue': float(total_revenue),
                'average_order_value': float(avg_order_value),
                'total_orders': total_orders,
                'total_customers': total_customers,
            },
            'top_products': list(top_products),
            'low_stock_alerts': list(low_stock_products),
            'top_customers': list(top_customers),
            'revenue_trend': revenue_trend,
            'category_performance': list(category_performance),
        })


class SalesReportView(APIView):
    """
    Detailed sales analytics endpoint.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        invoices = Invoice.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # Sales by status
        sales_by_status = invoices.values('status').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        )
        
        # Sales by payment method
        sales_by_payment = invoices.filter(status='paid').values('payment_method').annotate(
            count=Count('id'),
            total=Sum('total_amount')
        )
        
        return Response({
            'sales_by_status': list(sales_by_status),
            'sales_by_payment_method': list(sales_by_payment),
        })


class ProductPerformanceView(APIView):
    """
    Product performance metrics.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Products needing restock
        out_of_stock = Product.objects.filter(quantity_in_stock=0, is_active=True).count()
        low_stock = Product.objects.filter(
            quantity_in_stock__gt=0,
            quantity_in_stock__lt=10,
            is_active=True
        ).count()
        
        # Products by category
        products_by_category = Product.objects.filter(is_active=True).values(
            'category__name'
        ).annotate(count=Count('id'))
        
        return Response({
            'stock_alerts': {
                'out_of_stock': out_of_stock,
                'low_stock': low_stock,
            },
            'products_by_category': list(products_by_category),
        })


class CustomerAnalyticsView(APIView):
    """
    Customer analytics and behavior.
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Active vs total customers
        total_customers = Customer.objects.count()
        active_customers = Customer.objects.filter(is_active=True).count()
        
        # Customers with purchases
        customers_with_purchases = Customer.objects.filter(
            invoices__status='paid'
        ).distinct().count()
        
        return Response({
            'total_customers': total_customers,
            'active_customers': active_customers,
            'customers_with_purchases': customers_with_purchases,
        })
