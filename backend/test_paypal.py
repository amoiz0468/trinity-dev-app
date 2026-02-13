#!/usr/bin/env python
"""
Test PayPal API integration.
Run: python test_paypal.py
"""
import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'trinity_backend.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from django.conf import settings
from invoices.views import get_paypal_access_token
from invoices.models import Invoice
from users.models import Customer
from products.models import Product
import requests


def test_paypal_credentials():
    """Test that PayPal credentials are set."""
    print("1. Testing PayPal Credentials...")
    if not settings.PAYPAL_CLIENT_ID:
        print("   ❌ PAYPAL_CLIENT_ID not set")
        return False
    if not settings.PAYPAL_CLIENT_SECRET:
        print("   ❌ PAYPAL_CLIENT_SECRET not set")
        return False
    if not settings.PAYPAL_BASE_URL:
        print("   ❌ PAYPAL_BASE_URL not set")
        return False
    if not settings.PAYPAL_WEBHOOK_ID:
        print("   ❌ PAYPAL_WEBHOOK_ID not set")
        return False
    
    print("   ✅ All credentials are set")
    print(f"   Client ID: {settings.PAYPAL_CLIENT_ID[:20]}...")
    print(f"   Base URL: {settings.PAYPAL_BASE_URL}")
    return True


def test_paypal_token():
    """Test getting PayPal access token."""
    print("\n2. Testing PayPal OAuth Token...")
    try:
        token = get_paypal_access_token()
        if token:
            print(f"   ✅ Access token obtained: {token[:20]}...")
            return True
        else:
            print("   ❌ No token returned")
            return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False


def test_paypal_order_creation():
    """Test creating a PayPal order."""
    print("\n3. Testing PayPal Order Creation...")
    
    try:
        # Get or create test data
        customer = Customer.objects.first()
        if not customer:
            print("   ❌ No customers found. Create a customer first.")
            return False
        
        # Create test invoice
        invoice = Invoice.objects.create(
            customer=customer,
            invoice_number=f"TEST-{Invoice.objects.count() + 1}",
            status='pending',
            payment_method='paypal',
            subtotal=Decimal('99.99'),
            tax_rate=Decimal('20.00'),
            tax_amount=Decimal('20.00'),
            total_amount=Decimal('119.99'),
        )
        
        print(f"   Created test invoice: {invoice.invoice_number}")
        
        # Get PayPal token
        token = get_paypal_access_token()
        
        # Create PayPal order
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
        
        if response.status_code == 201:
            data = response.json()
            order_id = data.get('id')
            print(f"   ✅ PayPal order created: {order_id}")
            
            # Update invoice with PayPal transaction ID
            invoice.paypal_transaction_id = order_id
            invoice.save(update_fields=['paypal_transaction_id'])
            
            return True, order_id
        else:
            print(f"   ❌ Failed to create order: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False, None


def test_paypal_order_details():
    """Test fetching PayPal order details."""
    print("\n4. Testing PayPal Order Details...")
    
    # Get latest invoice with PayPal transaction ID
    invoice = Invoice.objects.filter(
        paypal_transaction_id__isnull=False
    ).order_by('-created_at').first()
    
    if not invoice:
        print("   ⚠️  No invoices with PayPal transaction ID found. Run test 3 first.")
        return False
    
    try:
        token = get_paypal_access_token()
        order_id = invoice.paypal_transaction_id
        
        response = requests.get(
            f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders/{order_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        
        if response.status_code == 200:
            data = response.json()
            status = data.get('status')
            print(f"   ✅ Order status: {status}")
            print(f"   Order ID: {order_id}")
            return True
        else:
            print(f"   ❌ Failed to fetch order: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("PayPal API Integration Test Suite")
    print("=" * 60)
    
    results = []
    
    # Test 1: Credentials
    results.append(("Credentials", test_paypal_credentials()))
    
    # Test 2: Token
    token_ok = test_paypal_token()
    results.append(("OAuth Token", token_ok))
    
    if not token_ok:
        print("\n❌ Token test failed. Cannot proceed with order tests.")
        print("\nMake sure:")
        print("  1. PayPal credentials are correct in .env")
        print("  2. PAYPAL_BASE_URL is set to sandbox: https://api-m.sandbox.paypal.com")
        print("  3. Network connection is working")
        return
    
    # Test 3: Order Creation
    order_ok, order_id = test_paypal_order_creation()
    results.append(("Order Creation", order_ok))
    
    if order_ok and order_id:
        # Test 4: Order Details
        results.append(("Order Details", test_paypal_order_details()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{name:<25} {status}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✅ All PayPal tests passed! Your integration is working.")
    else:
        print("\n⚠️  Some tests failed. Check the errors above.")


if __name__ == '__main__':
    main()
