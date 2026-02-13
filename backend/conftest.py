import pytest
from django.contrib.auth.models import User
from users.models import Customer
from products.models import Product, Category
from invoices.models import Invoice, InvoiceItem


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username='testuser',
        password='testpass123',
        email='test@example.com'
    )

@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username='staffuser',
        password='testpass123',
        email='staff@example.com',
        is_staff=True,
    )


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client

@pytest.fixture
def staff_client(api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    return api_client


@pytest.fixture
def customer(db, user):
    return Customer.objects.create(
        user=user,
        first_name='John',
        last_name='Doe',
        email='john@example.com',
        phone_number='+1234567890',
        address='123 Main St',
        zip_code='12345',
        city='New York',
        country='USA'
    )


@pytest.fixture
def category(db):
    return Category.objects.create(
        name='Beverages',
        description='Drinks and beverages'
    )


@pytest.fixture
def product(db, category):
    return Product.objects.create(
        name='Coca Cola',
        brand='Coca-Cola',
        price=2.50,
        category=category,
        quantity_in_stock=100,
        barcode='5449000000996'
    )


@pytest.fixture
def invoice(db, customer):
    return Invoice.objects.create(
        customer=customer,
        invoice_number='INV-2024-001',
        subtotal=100.00,
        tax_rate=20.00,
        tax_amount=20.00,
        total_amount=120.00,
        status='pending'
    )
