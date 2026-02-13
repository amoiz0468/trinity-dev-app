import pytest
from users.models import Customer


@pytest.mark.django_db
class TestCustomerModel:
    def test_customer_creation(self, customer):
        assert customer.first_name == 'John'
        assert customer.last_name == 'Doe'
        assert customer.email == 'john@example.com'
        assert customer.is_active is True
    
    def test_customer_full_name(self, customer):
        assert customer.full_name == 'John Doe'
    
    def test_customer_full_address(self, customer):
        expected = '123 Main St, 12345 New York, USA'
        assert customer.full_address == expected
    
    def test_customer_str_representation(self, customer):
        assert str(customer) == 'John Doe'


@pytest.mark.django_db
class TestCustomerAPI:
    def test_list_customers(self, authenticated_client, customer):
        response = authenticated_client.get('/api/users/')
        assert response.status_code == 200
        assert len(response.data['results']) >= 1
    
    def test_create_customer(self, staff_client):
        data = {
            'first_name': 'Jane',
            'last_name': 'Smith',
            'email': 'jane@example.com',
            'phone_number': '+1987654321',
            'address': '456 Oak Ave',
            'zip_code': '54321',
            'city': 'Los Angeles',
            'country': 'USA'
        }
        response = staff_client.post('/api/users/', data)
        assert response.status_code == 201
        assert response.data['first_name'] == 'Jane'
    
    def test_get_customer_detail(self, authenticated_client, customer):
        response = authenticated_client.get(f'/api/users/{customer.id}/')
        assert response.status_code == 200
        assert response.data['email'] == customer.email
    
    def test_update_customer(self, staff_client, customer):
        data = {'phone_number': '+1111111111'}
        response = staff_client.patch(f'/api/users/{customer.id}/', data)
        assert response.status_code == 200
        assert response.data['phone_number'] == '+1111111111'
    
    def test_delete_customer(self, staff_client, customer):
        response = staff_client.delete(f'/api/users/{customer.id}/')
        assert response.status_code == 204
        assert not Customer.objects.filter(id=customer.id).exists()
    
    def test_unauthorized_access(self, api_client):
        response = api_client.get('/api/users/')
        assert response.status_code == 401
