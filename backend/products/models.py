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
