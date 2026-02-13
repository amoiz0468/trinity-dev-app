from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, SAFE_METHODS
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
import requests
from django.conf import settings
from decimal import Decimal
from .models import Category, Product
from .serializers import (
    CategorySerializer,
    ProductSerializer,
    ProductCreateUpdateSerializer,
    ProductListSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category CRUD operations.
    
    List all categories, retrieve individual category details,
    create new categories, update existing ones, and delete categories.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdminUser()]


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product CRUD operations.
    
    Manage products with full CRUD functionality, search by name/brand/barcode,
    filter by category and status, sort by various fields, integrate with Open Food Facts API,
    and handle product image uploads to S3.
    
    **Features:**
    - Full product lifecycle management
    - Barcode scanning and auto-import from Open Food Facts
    - Product image upload and S3 storage
    - Stock quantity management
    - Nutritional information tracking
    - Advanced filtering and sorting capabilities
    """
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticated]
    search_fields = ['name', 'brand', 'barcode', 'category__name']
    filterset_fields = ['category', 'is_active']
    ordering_fields = ['name', 'price', 'quantity_in_stock', 'created_at']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductSerializer
    
    @action(detail=False, methods=['post'])
    def sync_openfoodfacts(self, request):
        """
        Sync products with Open Food Facts API.
        
        **Request Body:**
        ```json
        {
            "barcode": "3017620422003"
        }
        ```
        
        **Returns:**
        - Product data auto-populated from Open Food Facts
        - Nutritional information included
        - Either creates new product or updates existing one
        
        Accepts barcode for search and returns populated product data.
        """
        barcode = request.data.get('barcode')
        
        if not barcode:
            return Response(
                {'error': 'Barcode is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Query Open Food Facts API
            url = f"{settings.OPEN_FOOD_FACTS_API_URL}/product/{barcode}"
            response = requests.get(url)
            
            if response.status_code != 200:
                return Response(
                    {'error': 'Failed to fetch from Open Food Facts'},
                    status=status.HTTP_502_BAD_GATEWAY
                )
            
            data = response.json()
            
            if data.get('status') != 1:
                return Response(
                    {'error': 'Product not found in Open Food Facts'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            product_data = data.get('product', {})
            
            # Extract nutritional information
            nutriments = product_data.get('nutriments', {})
            
            # Check if product exists
            product, created = Product.objects.update_or_create(
                barcode=barcode,
                defaults={
                    'name': product_data.get('product_name', 'Unknown'),
                    'brand': product_data.get('brands', ''),
                    'picture_url': product_data.get('image_url', ''),
                    'description': product_data.get('ingredients_text', ''),
                    'openfoodfacts_id': product_data.get('id', ''),
                    # Open Food Facts does not provide price/stock, use safe defaults
                    'price': Decimal('0.01'),
                    'quantity_in_stock': 0,
                    'energy_kcal': nutriments.get('energy-kcal_100g'),
                    'fat': nutriments.get('fat_100g'),
                    'saturated_fat': nutriments.get('saturated-fat_100g'),
                    'carbohydrates': nutriments.get('carbohydrates_100g'),
                    'sugars': nutriments.get('sugars_100g'),
                    'proteins': nutriments.get('proteins_100g'),
                    'salt': nutriments.get('salt_100g'),
                    'fiber': nutriments.get('fiber_100g'),
                    'last_synced': timezone.now(),
                }
            )
            
            serializer = ProductSerializer(product)
            return Response({
                'created': created,
                'product': serializer.data
            }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
            
        except requests.RequestException as e:
            return Response(
                {'error': f'API request failed: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except Exception as e:
            return Response(
                {'error': f'An error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'], url_path='barcode/(?P<barcode>[^/.]+)')
    def by_barcode(self, request, barcode=None):
        """
        Retrieve a product by barcode.
        """
        try:
            product = Product.objects.get(barcode=barcode)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProductSerializer(product, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """
        Update product stock quantity.
        
        **Request Body:**
        ```json
        {
            "quantity": 100
        }
        ```
        
        **Parameters:**
        - pk: Product ID
        
        **Returns:** Updated product object with new stock level
        """
        product = self.get_object()
        quantity = request.data.get('quantity')
        
        if quantity is None:
            return Response(
                {'error': 'Quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quantity = int(quantity)
            if quantity < 0:
                return Response(
                    {'error': 'Quantity cannot be negative'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'Invalid quantity value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product.quantity_in_stock = quantity
        product.save()
        
        serializer = ProductSerializer(product)
        return Response(serializer.data)
