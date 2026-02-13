# Trinity Backend - Django REST API

## Overview
RESTful API for the Trinity grocery chain management system. Provides endpoints for user management, product inventory, invoicing, and performance reporting.

## Technology Stack
- **Framework**: Django 4.2.7
- **API**: Django REST Framework 3.14.0
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL (configurable)
- **Testing**: pytest, pytest-django
- **Documentation**: drf-spectacular (OpenAPI/Swagger)

## Setup Instructions

### 1. Create Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser
```bash
python manage.py createsuperuser
```

### 6. Run Development Server
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication
- `POST /api/auth/token/` - Obtain JWT token pair
- `POST /api/auth/token/refresh/` - Refresh access token
- `POST /api/auth/register/` - Register new user

### Users
- `GET /api/users/` - List all users
- `POST /api/users/` - Create new user
- `GET /api/users/{id}/` - Retrieve user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user
- `GET /api/users/{id}/history/` - User purchase history

### Products
- `GET /api/products/` - List all products
- `POST /api/products/` - Create new product
- `GET /api/products/{id}/` - Retrieve product details
- `PUT /api/products/{id}/` - Update product
- `DELETE /api/products/{id}/` - Delete product
- `POST /api/products/sync-openfoodfacts/` - Sync with Open Food Facts

### Invoices
- `GET /api/invoices/` - List all invoices
- `POST /api/invoices/` - Create new invoice
- `GET /api/invoices/{id}/` - Retrieve invoice details
- `PUT /api/invoices/{id}/` - Update invoice
- `DELETE /api/invoices/{id}/` - Delete invoice

### Reports
- `GET /api/reports/` - Get KPI reports
- `GET /api/reports/sales/` - Sales analytics
- `GET /api/reports/products/` - Product performance
- `GET /api/reports/customers/` - Customer analytics

## Testing
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=.

# Run specific test file
pytest apps/users/tests/test_models.py
```

## Security Features
- JWT token-based authentication
- CSRF protection
- XSS prevention
- SQL injection protection (Django ORM)
- CORS configuration
- Rate limiting (optional)

## Architecture
The backend follows a modular Django app structure:
- `users/` - User and customer management
- `products/` - Product inventory and Open Food Facts integration
- `invoices/` - Invoice and transaction management
- `reports/` - KPI and analytics engine
- `core/` - Shared utilities and base classes
