"""
URL configuration for trinity_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from users.views import CustomerViewSet, RegisterView, CurrentUserView
from products.views import CategoryViewSet, ProductViewSet
from invoices.views import InvoiceViewSet, InvoiceItemViewSet, CartViewSet, PayPalWebhookView
from reports.views import (
    ReportsView,
    SalesReportView,
    ProductPerformanceView,
    CustomerAnalyticsView
)
from trinity_backend.api_docs import api_index

# Router for API endpoints
router = DefaultRouter()
router.register(r'users', CustomerViewSet, basename='customer')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'invoice-items', InvoiceItemViewSet, basename='invoice-item')
router.register(r'cart', CartViewSet, basename='cart')

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    
    # API Documentation & Index
    path('api/', api_index, name='api-index'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc-ui'),
    
    # JWT Authentication
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('api/paypal/webhook/', PayPalWebhookView.as_view(), name='paypal-webhook'),
    
    # Reports
    path('api/reports/', ReportsView.as_view(), name='reports'),
    path('api/reports/sales/', SalesReportView.as_view(), name='sales-report'),
    path('api/reports/products/', ProductPerformanceView.as_view(), name='product-performance'),
    path('api/reports/customers/', CustomerAnalyticsView.as_view(), name='customer-analytics'),
    
    # API Router
    path('api/', include(router.urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
