from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'brand', 'category', 'price', 'quantity_in_stock', 'stock_status', 'is_active']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['name', 'brand', 'barcode', 'openfoodfacts_id']
    readonly_fields = ['created_at', 'updated_at', 'last_synced']
    fieldsets = [
        ('Basic Information', {
            'fields': ['name', 'brand', 'category', 'price', 'description']
        }),
        ('Images', {
            'fields': ['picture', 'picture_url']
        }),
        ('Stock', {
            'fields': ['quantity_in_stock']
        }),
        ('Nutritional Information', {
            'fields': [
                'energy_kcal', 'fat', 'saturated_fat', 'carbohydrates',
                'sugars', 'proteins', 'salt', 'fiber'
            ],
            'classes': ['collapse']
        }),
        ('Identifiers', {
            'fields': ['barcode', 'openfoodfacts_id']
        }),
        ('Metadata', {
            'fields': ['is_active', 'created_at', 'updated_at', 'last_synced']
        }),
    ]
