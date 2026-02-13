from django.contrib import admin
from .models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = ['total_price']
    fields = ['product', 'quantity', 'unit_price', 'total_price']


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'status', 'total_amount', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_method', 'created_at']
    search_fields = ['invoice_number', 'customer__first_name', 'customer__last_name']
    readonly_fields = ['created_at', 'updated_at', 'paid_at']
    inlines = [InvoiceItemInline]
    fieldsets = [
        ('Invoice Details', {
            'fields': ['invoice_number', 'customer', 'status', 'payment_method']
        }),
        ('Amounts', {
            'fields': ['subtotal', 'tax_rate', 'tax_amount', 'total_amount']
        }),
        ('PayPal', {
            'fields': ['paypal_transaction_id', 'paypal_payer_email'],
            'classes': ['collapse']
        }),
        ('Additional Information', {
            'fields': ['notes', 'created_at', 'updated_at', 'paid_at']
        }),
    ]


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'product_name', 'quantity', 'unit_price', 'total_price']
    list_filter = ['created_at']
    search_fields = ['product_name', 'invoice__invoice_number']
