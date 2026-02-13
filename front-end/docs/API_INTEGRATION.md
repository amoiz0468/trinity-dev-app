# API Integration Guide

## Overview

Trinity Mobile App integrates with a RESTful API for backend services and PayPal API for payment processing.

## Base Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
API_BASE_URL=https://your-backend-api.com/api
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
```

### API Client Configuration

Located in `src/services/apiClient.ts`:

```typescript
const API_CONFIG = {
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  TIMEOUT: 10000,
};
```

## Authentication Endpoints

### 1. Login
**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "user123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "createdAt": "2026-01-01T00:00:00Z"
    }
  }
}
```

### 2. Signup
**POST** `/auth/signup`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

Response: Same as login

### 3. Logout
**POST** `/auth/logout`

Headers: `Authorization: Bearer {token}`

### 4. Get Current User
**GET** `/auth/me`

Headers: `Authorization: Bearer {token}`

## Product Endpoints

### 1. Get Product by Barcode
**GET** `/products/barcode/:barcode`

Response:
```json
{
  "success": true,
  "data": {
    "id": "prod123",
    "name": "Organic Milk",
    "barcode": "1234567890",
    "brand": "Fresh Farms",
    "category": "Dairy",
    "price": 4.99,
    "imageUrl": "https://...",
    "description": "Fresh organic milk",
    "stock": 50,
    "nutritionalInfo": {
      "calories": 150,
      "protein": 8,
      "carbohydrates": 12,
      "fat": 8,
      "servingSize": "250ml"
    }
  }
}
```

### 2. Get Product by ID
**GET** `/products/:id`

### 3. Get Featured Products
**GET** `/products/featured?limit=10`

### 4. Search Products
**GET** `/products/search?q=milk`

### 5. Get Products by Category
**GET** `/products/category/:category`

## Order Endpoints

### 1. Create Order
**POST** `/orders`

Request:
```json
{
  "items": [
    {
      "productId": "prod123",
      "quantity": 2,
      "price": 4.99
    }
  ],
  "billingInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "address": "123 Main St",
    "zipCode": "12345",
    "city": "New York",
    "email": "user@example.com"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "order123",
    "userId": "user123",
    "items": [...],
    "totalAmount": 9.98,
    "billingInfo": {...},
    "status": "PENDING",
    "createdAt": "2026-02-03T12:00:00Z"
  }
}
```

### 2. Get Order by ID
**GET** `/orders/:id`

### 3. Get Order History
**GET** `/orders/history?limit=20&offset=0`

### 4. Update Order Status
**PATCH** `/orders/:id/status`

Request:
```json
{
  "status": "COMPLETED"
}
```

### 5. Cancel Order
**POST** `/orders/:id/cancel`

## Payment Endpoints

### 1. Create PayPal Payment
**POST** `/payments/paypal/create`

Request:
```json
{
  "amount": 9.98,
  "currency": "USD",
  "orderId": "order123",
  "billingInfo": {...}
}
```

Response:
```json
{
  "success": true,
  "data": {
    "paymentId": "PAYID-123",
    "approvalUrl": "https://www.paypal.com/checkoutnow?token=..."
  }
}
```

### 2. Execute PayPal Payment
**POST** `/payments/paypal/execute`

Request:
```json
{
  "paymentId": "PAYID-123",
  "payerId": "PAYER-123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "success": true,
    "transactionId": "TRANS-123",
    "message": "Payment completed successfully"
  }
}
```

### 3. Verify Payment
**GET** `/payments/verify/:transactionId`

## JWT Authentication

### Token Structure
All authenticated requests must include the JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Lifecycle
1. Received upon successful login/signup
2. Stored securely using Expo SecureStore
3. Automatically attached to all API requests via interceptor
4. Refreshed automatically when expired (if refresh endpoint available)
5. Cleared on logout or 401 response

### Token Interceptor

```typescript
this.client.interceptors.request.use(
  async (config) => {
    const token = await StorageService.getSecure(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);
```

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly message"
}
```

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/expired token)
- **404**: Not Found
- **500**: Internal Server Error

### Error Interceptor

```typescript
this.client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      await StorageService.deleteSecure(STORAGE_KEYS.AUTH_TOKEN);
      throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
    }
    // Handle other errors...
  }
);
```

## Rate Limiting

The API may implement rate limiting:
- **Rate**: 100 requests per minute per user
- **Header**: `X-RateLimit-Remaining`
- **Response**: 429 Too Many Requests

## Caching Strategy

1. **Products**: Cache for 1 hour
2. **User Data**: Cache until logout
3. **Cart**: Persistent local storage
4. **Orders**: Cache for 5 minutes

## Testing API Integration

### Mock API Responses

For testing, you can mock API responses:

```typescript
// In tests
jest.mock('../services/apiClient', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));
```

### Using Postman/Insomnia

Import the API collection:
1. Base URL: `{{API_BASE_URL}}`
2. Set environment variable for token
3. Test all endpoints

## PayPal Integration

### Setup
1. Create PayPal Developer Account
2. Create REST API app
3. Get Client ID and Secret
4. Configure in `.env` file

### Payment Flow
1. Create payment order via backend API
2. Get approval URL from PayPal
3. Open PayPal SDK or WebView
4. User completes payment
5. Capture payment via backend
6. Verify transaction
7. Update order status

### PayPal SDK (React Native)

```bash
npm install react-native-paypal
```

For detailed PayPal integration, refer to:
https://developer.paypal.com/docs/checkout/

## Best Practices

1. **Always use HTTPS** in production
2. **Validate all inputs** before sending to API
3. **Handle errors gracefully** with user-friendly messages
4. **Implement retry logic** for network failures
5. **Log errors** for debugging (not sensitive data)
6. **Use request timeout** to prevent hanging
7. **Implement request cancellation** for unmounted components
8. **Cache responses** where appropriate
9. **Minimize API calls** by batching requests
10. **Monitor API performance** and usage
