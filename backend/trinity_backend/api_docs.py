"""
API Documentation Views for Trinity Grocery API
"""
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET"])
def api_index(request):
    """
    Main API documentation index page
    """
    return JsonResponse({
        "name": "Trinity Grocery Back Office API",
        "version": "1.0.0",
        "description": "RESTful API for Trinity grocery chain back office management",
        "documentation": {
            "swagger_ui": "http://localhost:8000/api/docs/",
            "redoc": "http://localhost:8000/api/docs/redoc/",
            "schema": "http://localhost:8000/api/schema/"
        },
        "authentication": {
            "type": "JWT Bearer Token",
            "endpoint": "/api/auth/token/",
            "refresh_endpoint": "/api/auth/token/refresh/",
            "header": "Authorization: Bearer <token>"
        },
        "endpoints": {
            "authentication": {
                "obtain_token": "POST /api/auth/token/",
                "refresh_token": "POST /api/auth/token/refresh/"
            },
            "products": {
                "list": "GET /api/products/",
                "create": "POST /api/products/",
                "retrieve": "GET /api/products/{id}/",
                "update": "PUT /api/products/{id}/",
                "partial_update": "PATCH /api/products/{id}/",
                "delete": "DELETE /api/products/{id}/",
                "sync_with_barcode": "POST /api/products/sync_openfoodfacts/",
                "update_stock": "POST /api/products/{id}/update_stock/",
                "lookup_by_barcode": "GET /api/products/barcode/{barcode}/"
            },
            "categories": {
                "list": "GET /api/categories/",
                "create": "POST /api/categories/",
                "retrieve": "GET /api/categories/{id}/",
                "update": "PUT /api/categories/{id}/",
                "delete": "DELETE /api/categories/{id}/"
            },
            "customers": {
                "list": "GET /api/users/",
                "create": "POST /api/users/",
                "retrieve": "GET /api/users/{id}/",
                "update": "PUT /api/users/{id}/",
                "delete": "DELETE /api/users/{id}/",
                "purchase_history": "GET /api/users/{id}/history/"
            },
            "invoices": {
                "list": "GET /api/invoices/",
                "create": "POST /api/invoices/",
                "retrieve": "GET /api/invoices/{id}/",
                "update": "PUT /api/invoices/{id}/",
                "delete": "DELETE /api/invoices/{id}/",
                "paypal_create_order": "POST /api/invoices/{id}/create_paypal_order/",
                "paypal_capture_order": "POST /api/invoices/{id}/capture_paypal_order/"
            },
            "invoice_items": {
                "list": "GET /api/invoice-items/",
                "retrieve": "GET /api/invoice-items/{id}/"
            },
            "cart": {
                "get_cart": "GET /api/cart/",
                "add_item": "POST /api/cart/add_item/",
                "update_item": "PATCH /api/cart/update_item/",
                "remove_item": "DELETE /api/cart/remove_item/",
                "clear": "POST /api/cart/clear/"
            },
            "paypal": {
                "webhook": "POST /api/paypal/webhook/"
            },
            "reports": {
                "kpi_dashboard": "GET /api/reports/?days=30",
                "sales_report": "GET /api/reports/sales/?days=30",
                "product_performance": "GET /api/reports/products/",
                "customer_analytics": "GET /api/reports/customers/"
            }
        },
        "features": {
            "products": [
                "Full product lifecycle management",
                "Product image upload to S3",
                "Barcode scanning with Open Food Facts integration",
                "Stock quantity tracking",
                "Nutritional information management",
                "Advanced filtering and sorting"
            ],
            "invoicing": [
                "Create invoices with multiple items",
                "Track payment status",
                "Support multiple payment methods",
                "Automatic tax calculation",
                "Customer purchase history"
            ],
            "reporting": [
                "KPI Dashboard",
                "Sales Reports",
                "Product Performance Analytics",
                "Customer Analytics"
            ]
        },
        "quick_start": {
            "step_1": "Get JWT token: POST /api/auth/token/ with username & password",
            "step_2": "Include token in Authorization header for all requests",
            "step_3": "Visit /api/docs/ for interactive API documentation",
            "step_4": "Use Swagger UI to test all endpoints with payloads"
        }
    })
