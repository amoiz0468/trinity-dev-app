from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone_number', 'city', 'country', 'is_active', 'created_at']
    list_filter = ['is_active', 'country', 'city', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'phone_number']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = [
        ('Personal Information', {
            'fields': ['user', 'first_name', 'last_name', 'email', 'phone_number']
        }),
        ('Billing Address', {
            'fields': ['address', 'zip_code', 'city', 'country']
        }),
        ('Status', {
            'fields': ['is_active', 'created_at', 'updated_at']
        }),
    ]
