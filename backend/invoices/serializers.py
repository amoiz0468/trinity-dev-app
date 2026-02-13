from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from drf_spectacular.utils import extend_schema_field
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import Invoice, InvoiceItem, Cart, CartItem
from users.serializers import CustomerSerializer
from products.serializers import ProductListSerializer
from products.models import Product


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for Invoice Items"""
    product_details = ProductListSerializer(source='product', read_only=True)
    
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'product', 'product_details', 'quantity',
            'unit_price', 'total_price', 'product_name', 'product_brand'
        ]
        read_only_fields = ['id', 'total_price', 'product_name', 'product_brand']


class InvoiceItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invoice items"""
    class Meta:
        model = InvoiceItem
        fields = ['product', 'quantity', 'unit_price']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model"""
    customer_details = CustomerSerializer(source='customer', read_only=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer', 'customer_details',
            'status', 'payment_method', 'subtotal', 'tax_rate',
            'tax_amount', 'total_amount', 'total_items',
            'paypal_transaction_id', 'paypal_payer_email',
            'billing_first_name', 'billing_last_name', 'billing_address',
            'billing_zip_code', 'billing_city', 'billing_country',
            'notes', 'created_at', 'updated_at', 'paid_at', 'items'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @extend_schema_field(serializers.IntegerField())
    def get_total_items(self, obj):
        return obj.total_items


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating invoices"""
    items = InvoiceItemCreateSerializer(many=True, write_only=True)
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Invoice
        fields = [
            'customer', 'invoice_number', 'payment_method',
            'tax_rate', 'notes',
            'billing_first_name', 'billing_last_name', 'billing_address',
            'billing_zip_code', 'billing_city', 'billing_country',
            'items'
        ]

    def validate_payment_method(self, value):
        if value not in ['cash', 'card', 'paypal', 'other']:
            raise ValidationError('Invalid payment method.')
        return value
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')

        # Calculate subtotal from items
        subtotal = sum(
            item_data['unit_price'] * item_data['quantity']
            for item_data in items_data
        )
        
        # Calculate tax and total
        tax_rate = validated_data.get('tax_rate', Decimal('20.00'))
        tax_amount = (subtotal * tax_rate) / 100
        total_amount = subtotal + tax_amount
        
        # Add calculated fields to validated_data
        validated_data['subtotal'] = subtotal
        validated_data['tax_amount'] = tax_amount
        validated_data['total_amount'] = total_amount
        if validated_data.get('payment_method') == 'paypal':
            validated_data['status'] = 'pending'
            validated_data['paid_at'] = None
        else:
            validated_data['status'] = 'paid'
            validated_data['paid_at'] = timezone.now()

        with transaction.atomic():
            locked_products = {}
            for item_data in items_data:
                product = Product.objects.select_for_update().get(pk=item_data['product'].pk)
                if product.quantity_in_stock < item_data['quantity']:
                    raise ValidationError(
                        {'items': f'Insufficient stock for {product.name}.'}
                    )
                locked_products[product.pk] = product

            # Create invoice
            invoice = Invoice.objects.create(**validated_data)

            # Create invoice items and decrement stock
            for item_data in items_data:
                product = locked_products[item_data['product'].pk]
                item_payload = item_data.copy()
                item_payload['product'] = product
                InvoiceItem.objects.create(invoice=invoice, **item_payload)
                product.quantity_in_stock = product.quantity_in_stock - item_data['quantity']
                product.save(update_fields=['quantity_in_stock'])

        return invoice


class CartItemSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_details',
            'quantity', 'unit_price', 'total_price'
        ]
        read_only_fields = ['id', 'total_price', 'unit_price']


class CartItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['product', 'quantity']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'customer', 'total_items', 'subtotal', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for invoice lists"""
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'customer_name', 'status',
            'total_amount', 'payment_method', 'total_items', 'created_at'
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_total_items(self, obj):
        return obj.total_items
