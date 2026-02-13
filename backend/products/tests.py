import pytest
from products.models import Product, Category


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
