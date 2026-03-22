import pytest
from django.utils import timezone
from datetime import timedelta
from products.models import Product, Category, Promotion


@pytest.mark.django_db
class TestProductModel:
    def test_product_creation(self, product):
        assert product.name == 'Coca Cola'
        assert product.brand == 'Coca-Cola'
        assert product.price == 2.50
        assert product.is_active is True
    
    def test_product_stock_status(self, product):
        assert product.is_in_stock is True
        assert product.stock_status == 'In Stock'
        
        product.quantity_in_stock = 5
        assert product.stock_status == 'Low Stock'
        
        product.quantity_in_stock = 0
        assert product.is_in_stock is False
        assert product.stock_status == 'Out of Stock'
    
    def test_product_str_representation(self, product):
        assert str(product) == 'Coca Cola (Coca-Cola)'
    
    def test_product_current_price_without_promotion(self, product):
        """Test that current_price returns regular price when no active promotion"""
        assert product.current_price == product.price
    
    def test_product_current_price_with_active_promotion(self, product):
        """Test that current_price returns discounted price when there's an active promotion"""
        from decimal import Decimal
        now = timezone.now()
        promotion = Promotion.objects.create(
            title='Test Promotion',
            description='Test discount',
            product=product,
            discount_percentage=Decimal('20.00'),  # 20% discount
            start_date=now - timedelta(hours=1),
            end_date=now + timedelta(hours=1),
            is_active=True
        )
        
        expected_discounted_price = Decimal(str(product.price)) * Decimal('0.8')  # 20% off
        assert product.current_price == expected_discounted_price
    
    def test_product_current_price_with_inactive_promotion(self, product):
        """Test that current_price returns regular price when promotion is inactive"""
        now = timezone.now()
        promotion = Promotion.objects.create(
            title='Test Promotion',
            description='Test discount',
            product=product,
            discount_percentage=20.00,
            start_date=now - timedelta(hours=2),
            end_date=now - timedelta(hours=1),  # Ended 1 hour ago
            is_active=True
        )
        
        # Should return regular price since promotion is not active
        assert product.current_price == product.price


@pytest.mark.django_db
class TestProductAPI:
    def test_list_products(self, authenticated_client, product):
        response = authenticated_client.get('/api/products/')
        assert response.status_code == 200
    
    def test_create_product(self, staff_client, category):
        data = {
            'name': 'Pepsi',
            'brand': 'PepsiCo',
            'price': '2.30',
            'category': category.id,
            'quantity_in_stock': 50
        }
        response = staff_client.post('/api/products/', data)
        assert response.status_code == 201
        assert response.data['name'] == 'Pepsi'
