from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Category(models.Model):
    """
    Product category for organizing products.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = 'Categories'
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Product model storing detailed product information.
    Integrates with Open Food Facts API for automated updates.
    """
    # Basic Information
    name = models.CharField(max_length=255)
    brand = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products'
    )
    
    # Visual
    picture = models.ImageField(upload_to='products/', blank=True, null=True)
    picture_url = models.URLField(max_length=500, blank=True)
    
    # Stock Management
    quantity_in_stock = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Nutritional Information
    energy_kcal = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fat = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    saturated_fat = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    carbohydrates = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    sugars = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    proteins = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    salt = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    fiber = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Additional Fields
    description = models.TextField(blank=True)
    barcode = models.CharField(max_length=50, unique=True, null=True, blank=True)
    
    # Open Food Facts Integration
    openfoodfacts_id = models.CharField(max_length=100, blank=True, unique=True, null=True)
    last_synced = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['barcode']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.brand})" if self.brand else self.name
    
    @property
    def is_in_stock(self):
        return self.quantity_in_stock > 0
    
    @property
    def stock_status(self):
        if self.quantity_in_stock == 0:
            return "Out of Stock"
        elif self.quantity_in_stock < 10:
            return "Low Stock"
        return "In Stock"

    @property
    def current_price(self):
        """Return the current price with discount applied if there's an active promotion"""
        from django.utils import timezone
        from decimal import Decimal
        from django.db.models import Q
        now = timezone.now()
        active_promotion = Promotion.objects.filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now
        ).filter(
            Q(product=self) | Q(product__isnull=True)
        ).order_by('-discount_percentage', '-start_date').first()
        
        if active_promotion and active_promotion.discount_percentage:
            price = Decimal(str(self.price))
            discount_percentage = Decimal(str(active_promotion.discount_percentage))
            discount_amount = (price * discount_percentage) / Decimal('100')
            return price - discount_amount
        return self.price


class Promotion(models.Model):
    """
    Model for storing promotional banners and deals.
    """
    title = models.CharField(max_length=200)
    description = models.TextField()
    image_url = models.URLField(max_length=500, blank=True)
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promotions'
    )
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)]
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_currently_active(self):
        from django.utils import timezone
        now = timezone.now()
        return self.is_active and self.start_date <= now <= self.end_date
