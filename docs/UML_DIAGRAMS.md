# UML Diagrams

## Class Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User                                      │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                      │
│ - email: string                                                   │
│ - firstName: string                                               │
│ - lastName: string                                                │
│ - phone?: string                                                  │
│ - createdAt: string                                               │
├─────────────────────────────────────────────────────────────────┤
│ + login(): Promise<AuthResponse>                                  │
│ + signup(): Promise<AuthResponse>                                 │
│ + logout(): Promise<void>                                         │
│ + updateProfile(): Promise<User>                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 1
                               │
                               │ *
┌─────────────────────────────────────────────────────────────────┐
│                         Order                                     │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                      │
│ - userId: string                                                  │
│ - items: CartItem[]                                               │
│ - totalAmount: number                                             │
│ - billingInfo: BillingInfo                                        │
│ - paymentMethod: string                                           │
│ - status: OrderStatus                                             │
│ - createdAt: string                                               │
├─────────────────────────────────────────────────────────────────┤
│ + createOrder(): Promise<Order>                                   │
│ + getOrderById(): Promise<Order>                                  │
│ + updateStatus(): Promise<Order>                                  │
│ + cancelOrder(): Promise<Order>                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 1
                               │
                               │ *
┌─────────────────────────────────────────────────────────────────┐
│                       CartItem                                    │
├─────────────────────────────────────────────────────────────────┤
│ - product: Product                                                │
│ - quantity: number                                                │
├─────────────────────────────────────────────────────────────────┤
│ + calculateSubtotal(): number                                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 1
                               │
                               │ 1
┌─────────────────────────────────────────────────────────────────┐
│                       Product                                     │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                      │
│ - name: string                                                    │
│ - barcode: string                                                 │
│ - brand: string                                                   │
│ - category: string                                                │
│ - price: number                                                   │
│ - imageUrl: string                                                │
│ - description?: string                                            │
│ - stock: number                                                   │
│ - nutritionalInfo?: NutritionalInfo                               │
├─────────────────────────────────────────────────────────────────┤
│ + getProductByBarcode(): Promise<Product>                         │
│ + getProductById(): Promise<Product>                              │
│ + searchProducts(): Promise<Product[]>                            │
│ + checkStock(): Promise<boolean>                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ 1
                               │
                               │ 0..1
┌─────────────────────────────────────────────────────────────────┐
│                    NutritionalInfo                                │
├─────────────────────────────────────────────────────────────────┤
│ - calories: number                                                │
│ - protein: number                                                 │
│ - carbohydrates: number                                           │
│ - fat: number                                                     │
│ - fiber?: number                                                  │
│ - sodium?: number                                                 │
│ - sugar?: number                                                  │
│ - servingSize: string                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Cart                                      │
├─────────────────────────────────────────────────────────────────┤
│ - items: CartItem[]                                               │
│ - totalAmount: number                                             │
│ - totalItems: number                                              │
├─────────────────────────────────────────────────────────────────┤
│ + addToCart(product, quantity): void                              │
│ + removeFromCart(productId): void                                 │
│ + updateQuantity(productId, quantity): void                       │
│ + clearCart(): void                                               │
│ + calculateTotal(): number                                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      BillingInfo                                  │
├─────────────────────────────────────────────────────────────────┤
│ - firstName: string                                               │
│ - lastName: string                                                │
│ - address: string                                                 │
│ - zipCode: string                                                 │
│ - city: string                                                    │
│ - email?: string                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PaymentRequest                                 │
├─────────────────────────────────────────────────────────────────┤
│ - amount: number                                                  │
│ - currency: string                                                │
│ - orderId: string                                                 │
│ - billingInfo: BillingInfo                                        │
├─────────────────────────────────────────────────────────────────┤
│ + initiatePayment(): Promise<PaymentResponse>                     │
│ + executePayment(): Promise<PaymentResponse>                      │
│ + verifyPayment(): Promise<boolean>                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   PaymentResponse                                 │
├─────────────────────────────────────────────────────────────────┤
│ - success: boolean                                                │
│ - transactionId: string                                           │
│ - message?: string                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     <<enumeration>>                               │
│                      OrderStatus                                  │
├─────────────────────────────────────────────────────────────────┤
│ PENDING                                                           │
│ PROCESSING                                                        │
│ COMPLETED                                                         │
│ CANCELLED                                                         │
└─────────────────────────────────────────────────────────────────┘
```

## Activity Diagram - User Shopping Flow

```
                    ┌─────────┐
                    │  Start  │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  Login  │
                    └────┬────┘
                         │
                ┌────────▼────────┐
                │   View Home     │
                │   Dashboard     │
                └────┬────┬───────┘
                     │    │
        ┌────────────┘    └────────────┐
        │                              │
  ┌─────▼──────┐              ┌───────▼────────┐
  │   Browse   │              │  Scan Product  │
  │  Products  │              │   (Camera)     │
  └─────┬──────┘              └───────┬────────┘
        │                              │
        │        ┌─────────────────────┘
        │        │
  ┌─────▼────────▼─────┐
  │  View Product      │
  │  Details           │
  └─────┬──────────────┘
        │
  ┌─────▼──────┐
  │ Add to     │◄──────┐
  │ Cart       │       │
  └─────┬──────┘       │
        │              │
  ┌─────▼──────┐       │
  │ Continue   ├───────┘
  │ Shopping?  │
  └─────┬──────┘
        │ No
  ┌─────▼──────┐
  │ View Cart  │
  └─────┬──────┘
        │
  ┌─────▼──────┐
  │ Modify     │
  │ Cart?      ├─────► Remove/Update Items
  └─────┬──────┘              │
        │ No                  │
        │◄────────────────────┘
        │
  ┌─────▼────────────┐
  │ Enter Billing    │
  │ Information      │
  └─────┬────────────┘
        │
  ┌─────▼────────────┐
  │ Review Order     │
  └─────┬────────────┘
        │
  ┌─────▼────────────┐
  │ Proceed to       │
  │ Payment          │
  └─────┬────────────┘
        │
  ┌─────▼────────────┐
  │ PayPal Payment   │◄──┐
  └─────┬────────────┘   │
        │                │ Retry
  ┌─────▼────────────┐   │
  │ Payment          │   │
  │ Successful?      ├───┘ No
  └─────┬────────────┘
        │ Yes
  ┌─────▼────────────┐
  │ Order            │
  │ Confirmation     │
  └─────┬────────────┘
        │
  ┌─────▼────────────┐
  │ Clear Cart       │
  └─────┬────────────┘
        │
  ┌─────▼────────────┐
  │ View Order       │
  │ History          │
  └─────┬────────────┘
        │
    ┌───▼───┐
    │  End  │
    └───────┘
```

## Sequence Diagram - Barcode Scanning and Purchase

```
User        Scanner     Product     Cart        Order       Payment     Database
 │           Screen      Service    Context     Service     Service
 │             │           │          │           │           │           │
 │──Scan───────►           │          │           │           │           │
 │             │           │          │           │           │           │
 │             │──Request──►          │           │           │           │
 │             │  Barcode  │          │           │           │           │
 │             │           │──Query───────────────────────────────────────►
 │             │           │          │           │           │           │
 │             │           │◄─Product─────────────────────────────────────┤
 │             │           │  Data    │           │           │           │
 │             │           │          │           │           │           │
 │             │──────────►│          │           │           │           │
 │             │  Product  │          │           │           │           │
 │◄────────────┤  Found    │          │           │           │           │
 │   Display   │           │          │           │           │           │
 │             │           │          │           │           │           │
 │──Add to─────────────────────────────►          │           │           │
 │   Cart      │           │          │           │           │           │
 │             │           │          │──Update───────────────────────────►
 │             │           │          │  Cart     │           │           │
 │             │           │          │           │           │           │
 │◄────────────────────────────────────┤          │           │           │
 │   Success   │           │          │           │           │           │
 │             │           │          │           │           │           │
 │──Checkout───────────────────────────────────────►          │           │
 │             │           │          │           │           │           │
 │             │           │          │           │──Create───────────────►
 │             │           │          │           │  Order    │           │
 │             │           │          │           │           │           │
 │◄────────────────────────────────────────────────┤          │           │
 │   Order ID  │           │          │           │           │           │
 │             │           │          │           │           │           │
 │──Pay────────────────────────────────────────────────────────►          │
 │             │           │          │           │           │           │
 │             │           │          │           │           │──Initiate─►
 │             │           │          │           │           │  PayPal   │
 │             │           │          │           │           │           │
 │◄────────────────────────────────────────────────────────────┤          │
 │  PayPal URL │           │          │           │           │           │
 │             │           │          │           │           │           │
 │──Complete Payment (PayPal)──────────────────────────────────►          │
 │             │           │          │           │           │           │
 │             │           │          │           │           │──Execute──►
 │             │           │          │           │           │  Payment  │
 │             │           │          │           │           │           │
 │◄────────────────────────────────────────────────────────────┤          │
 │  Payment    │           │          │           │           │           │
 │  Success    │           │          │           │           │           │
 │             │           │          │           │           │           │
 │             │           │          │           │──Update───────────────►
 │             │           │          │           │  Order    │           │
 │             │           │          │           │  Status   │           │
 │             │           │          │           │           │           │
 │             │           │          │──Clear────────────────────────────►
 │             │           │          │  Cart     │           │           │
 │             │           │          │           │           │           │
 │◄────────────────────────────────────┤          │           │           │
 │  Navigate to│           │          │           │           │           │
 │  Order      │           │          │           │           │           │
 │  Confirmed  │           │          │           │           │           │
```

## Component Hierarchy Diagram

```
App
└── SafeAreaProvider
    └── AuthProvider
        └── CartProvider
            └── NavigationContainer
                ├── AuthStack (if not authenticated)
                │   ├── LoginScreen
                │   └── SignupScreen
                │
                └── AppStack (if authenticated)
                    ├── MainTabs
                    │   ├── HomeScreen
                    │   │   ├── ProductCard (multiple)
                    │   │   └── QuickActionCard
                    │   │
                    │   ├── ScannerScreen
                    │   │   └── CameraView
                    │   │
                    │   ├── CartScreen
                    │   │   ├── CartItem (multiple)
                    │   │   └── EmptyState (if empty)
                    │   │
                    │   ├── OrderHistoryScreen
                    │   │   ├── OrderCard (multiple)
                    │   │   └── EmptyState (if empty)
                    │   │
                    │   └── ProfileScreen
                    │       ├── ProfileItem (multiple)
                    │       └── MenuSection (multiple)
                    │
                    ├── ProductDetailsScreen
                    │   ├── Image
                    │   ├── NutritionItem (multiple)
                    │   └── Button
                    │
                    ├── CheckoutScreen
                    │   └── Input (multiple)
                    │
                    └── PaymentScreen
                        └── Button
```

## State Management Diagram

```
┌──────────────────────────────────────────────────────────┐
│                    Application State                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────┐      ┌────────────────────┐    │
│  │   Auth Context     │      │   Cart Context     │    │
│  ├────────────────────┤      ├────────────────────┤    │
│  │ - user             │      │ - items[]          │    │
│  │ - isAuthenticated  │      │ - totalAmount      │    │
│  │ - isLoading        │      │ - totalItems       │    │
│  ├────────────────────┤      ├────────────────────┤    │
│  │ + login()          │      │ + addToCart()      │    │
│  │ + signup()         │      │ + removeFromCart() │    │
│  │ + logout()         │      │ + updateQuantity() │    │
│  │ + refreshUser()    │      │ + clearCart()      │    │
│  └────────────────────┘      └────────────────────┘    │
│           │                           │                 │
│           └───────────┬───────────────┘                 │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │  Local Storage  │                        │
│              ├─────────────────┤                        │
│              │ - SecureStore   │ (auth tokens)          │
│              │ - AsyncStorage  │ (user data, cart)      │
│              └─────────────────┘                        │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │   API Services  │                        │
│              ├─────────────────┤                        │
│              │ - authService   │                        │
│              │ - productService│                        │
│              │ - orderService  │                        │
│              │ - paymentService│                        │
│              └─────────────────┘                        │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │   API Client    │                        │
│              │   (Axios)       │                        │
│              └─────────────────┘                        │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │  Backend API    │                        │
│              └─────────────────┘                        │
└──────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌────────────┐
│    User    │
└──────┬─────┘
       │
       ▼
┌─────────────────┐
│  Presentation   │
│  Layer (Views)  │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│  Application       │
│  Layer (Contexts)  │
└─────────┬──────────┘
          │
          ▼
┌──────────────────────┐
│  Business Logic      │
│  Layer (Services)    │
└──────────┬───────────┘
           │
           ▼
┌───────────────────────┐
│  Data Access Layer    │
│  (API Client)         │
└───────────┬───────────┘
            │
            ▼
┌────────────────────────┐
│  External Services     │
│  (Backend API, PayPal) │
└────────────────────────┘
```
