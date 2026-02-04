# Trinity Mobile App - Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Pattern](#architecture-pattern)
3. [Project Structure](#project-structure)
4. [Design Patterns](#design-patterns)
5. [Data Flow](#data-flow)
6. [Security](#security)

## Overview

Trinity Mobile App is a React Native application built with TypeScript for both iOS and Android platforms. It follows the MVVM (Model-View-ViewModel) architecture pattern with React Context API for state management.

## Architecture Pattern

### MVVM (Model-View-ViewModel)

The application follows the MVVM pattern:

- **Model**: Data models and business logic (`src/types`, `src/services`)
- **View**: React Native components and screens (`src/screens`, `src/components`)
- **ViewModel**: Context providers and hooks (`src/contexts`)

### Key Components

#### 1. Services Layer
Located in `src/services/`, this layer handles all API communications:

- **apiClient.ts**: Axios-based HTTP client with interceptors
- **authService.ts**: Authentication operations (login, signup, logout)
- **productService.ts**: Product-related operations
- **orderService.ts**: Order management
- **paymentService.ts**: Payment processing with PayPal

#### 2. Context Providers
State management using React Context API:

- **AuthContext**: User authentication state
- **CartContext**: Shopping cart state management

#### 3. Components
Reusable UI components following atomic design principles:

- **Button**: Customizable button with variants
- **Input**: Form input with validation feedback
- **ProductCard**: Product display component
- **CartItem**: Cart item with quantity controls
- **Loading**: Loading state indicator
- **EmptyState**: Empty state placeholder

#### 4. Screens
Main application screens:

- **LoginScreen**: User authentication
- **SignupScreen**: User registration
- **HomeScreen**: Dashboard with featured products
- **ScannerScreen**: Barcode scanning
- **CartScreen**: Shopping cart management
- **ProductDetailsScreen**: Product information
- **CheckoutScreen**: Billing information
- **PaymentScreen**: PayPal integration
- **OrderHistoryScreen**: Past orders
- **ProfileScreen**: User profile management

## Project Structure

```
trinity-dev-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── ProductCard.tsx
│   │   ├── CartItem.tsx
│   │   ├── Loading.tsx
│   │   └── EmptyState.tsx
│   ├── screens/            # Application screens
│   │   ├── LoginScreen.tsx
│   │   ├── SignupScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ScannerScreen.tsx
│   │   ├── CartScreen.tsx
│   │   ├── ProductDetailsScreen.tsx
│   │   ├── CheckoutScreen.tsx
│   │   ├── PaymentScreen.tsx
│   │   ├── OrderHistoryScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── contexts/           # State management
│   │   ├── AuthContext.tsx
│   │   └── CartContext.tsx
│   ├── services/           # API services
│   │   ├── apiClient.ts
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   └── paymentService.ts
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   ├── storage.ts
│   │   ├── validation.ts
│   │   └── format.ts
│   ├── constants/          # App constants
│   │   └── index.ts
│   └── __tests__/         # Unit tests
├── assets/                 # Static assets
├── docs/                   # Documentation
├── App.tsx                 # Application entry point
├── package.json            # Dependencies
└── tsconfig.json          # TypeScript config
```

## Design Patterns

### 1. Singleton Pattern
- **apiClient**: Single instance for all HTTP requests
- **Service classes**: Single instances for each service type

### 2. Context Pattern
- **AuthContext**: Global authentication state
- **CartContext**: Global cart state

### 3. Observer Pattern
- React hooks (`useEffect`, `useState`) for reactive updates
- Context consumers automatically re-render on state changes

### 4. Factory Pattern
- Component variants (Button, Input with different styles)

### 5. Facade Pattern
- Service layer abstracts complex API interactions

## Data Flow

### Authentication Flow
```
1. User enters credentials → LoginScreen
2. LoginScreen calls AuthContext.login()
3. AuthContext uses authService.login()
4. authService makes API request via apiClient
5. Token stored in SecureStore
6. User data stored in AsyncStorage
7. AuthContext updates state
8. Navigation redirects to Main
```

### Shopping Flow
```
1. User scans barcode → ScannerScreen
2. ProductService fetches product by barcode
3. Product added to CartContext
4. User proceeds to checkout
5. OrderService creates order
6. PaymentService initiates PayPal payment
7. Payment confirmed
8. Order status updated
9. Cart cleared
10. Navigation to OrderConfirmation
```

### Data Persistence
- **Sensitive Data**: Expo SecureStore (auth tokens)
- **User Preferences**: AsyncStorage (cart, user data)
- **Remote Data**: RESTful API with JWT authentication

## Security

### 1. Authentication
- JWT tokens for API authentication
- Secure token storage using Expo SecureStore
- Token refresh mechanism in API interceptors
- Automatic logout on 401 responses

### 2. Network Security
- HTTPS for all API requests
- Request/Response interceptors for token management
- Error handling with proper user feedback

### 3. Data Validation
- Client-side validation for all user inputs
- TypeScript for type safety
- Secure password requirements

### 4. Payment Security
- PayPal SDK for secure payment processing
- No sensitive payment data stored locally
- Transaction verification via API callbacks

### 5. Permissions
- Camera permission for barcode scanning
- Proper permission request flow
- Graceful handling of denied permissions

## Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Storage**: Expo SecureStore, AsyncStorage
- **Camera**: Expo Camera & Barcode Scanner
- **Testing**: Jest, React Native Testing Library
- **CI/CD**: GitHub Actions

## Scalability Considerations

1. **Modular Architecture**: Easy to add new features
2. **Separation of Concerns**: Clear boundaries between layers
3. **Reusable Components**: DRY principle
4. **Type Safety**: TypeScript prevents runtime errors
5. **Testing**: Unit tests ensure code quality
6. **Code Splitting**: Lazy loading for better performance

## Performance Optimizations

1. **Memoization**: React.memo for expensive components
2. **Lazy Loading**: Code splitting for routes
3. **Image Optimization**: Cached images with appropriate sizes
4. **API Caching**: Reduce redundant API calls
5. **Virtual Lists**: FlatList for large datasets
