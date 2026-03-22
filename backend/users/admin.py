from django.contrib import admin
from .models import Customer, Notification


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


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'type', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__email', 'user__username']
    readonly_fields = ['created_at']
