from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone
from users.models import Customer
from products.models import Product


class Invoice(models.Model):
    """
    Invoice model for tracking customer purchases.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('paypal', 'PayPal'),
        ('other', 'Other'),
    ]
    
    # Relations
    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name='invoices'
    )
    
    # Invoice Details
    invoice_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    
    # Amounts
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('20.00'),  # 20% VAT
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    tax_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # PayPal Integration (Future)
    paypal_transaction_id = models.CharField(max_length=100, blank=True)
    paypal_payer_email = models.EmailField(blank=True)

    # Billing Details (per transaction)
    billing_first_name = models.CharField(max_length=100, blank=True)
    billing_last_name = models.CharField(max_length=100, blank=True)
    billing_address = models.TextField(blank=True)
    billing_zip_code = models.CharField(max_length=20, blank=True)
    billing_city = models.CharField(max_length=100, blank=True)
    billing_country = models.CharField(max_length=100, blank=True)
    
    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['invoice_number']),
            models.Index(fields=['customer', 'created_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.customer.full_name}"
    
    def save(self, *args, **kwargs):
        # Auto-generate invoice number if not provided
        if not self.invoice_number:
            today = timezone.now()
            date_str = today.strftime('%Y%m%d')
            # Count invoices created today
            count = Invoice.objects.filter(
                invoice_number__startswith=f'INV-{date_str}'
            ).count() + 1
            self.invoice_number = f'INV-{date_str}-{count:04d}'
        super().save(*args, **kwargs)
    
    def calculate_totals(self):
        """Calculate subtotal, tax, and total from invoice items"""
        self.subtotal = sum(item.total_price for item in self.items.all())
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        self.total_amount = self.subtotal + self.tax_amount
        self.save()
    
    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())


class Cart(models.Model):
    """
    Shopping cart for a customer.
    """
    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.customer.full_name}"

    @property
    def total_items(self):
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.all())


class CartItem(models.Model):
    """
    Items in a shopping cart.
    """
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='cart_items'
    )
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('cart', 'product')
        ordering = ['created_at']

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"

    def save(self, *args, **kwargs):
        self.unit_price = self.unit_price or self.product.price
        self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    """
    Individual items in an invoice.
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='invoice_items'
    )
    
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Snapshot of product info at time of sale
    product_name = models.CharField(max_length=255)
    product_brand = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        # Calculate total price
        self.total_price = self.unit_price * self.quantity
        
        # Save product snapshot
        if not self.product_name:
            self.product_name = self.product.name
            self.product_brand = self.product.brand
        
        super().save(*args, **kwargs)
