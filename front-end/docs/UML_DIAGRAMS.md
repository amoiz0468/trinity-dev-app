# UML Diagrams

## Class Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                              User                                 │
├─────────────────────────────────────────────────────────────────┤
│ - id: string                                                      │
│ - email: string                                                   │
│ - role: user | admin                                              │
└─────────────────────────────────────────────────────────────────┘
            │ 1
            │
            │ 0..1
┌─────────────────────────────────────────────────────────────────┐
│                           Customer                                │
├─────────────────────────────────────────────────────────────────┤
│ - first_name: string                                              │
│ - last_name: string                                               │
│ - phone_number: string                                            │
│ - address: string                                                 │
└─────────────────────────────────────────────────────────────────┘
            │ 1
            │
            │ 1
┌─────────────────────────────────────────────────────────────────┐
│                              Cart                                 │
├─────────────────────────────────────────────────────────────────┤
│ - items: CartItem[]                                               │
│ - subtotal: number                                                │
│ - total_items: number                                             │
└─────────────────────────────────────────────────────────────────┘
            │ 1
            │
            │ *
┌─────────────────────────────────────────────────────────────────┐
│                           CartItem                                │
├─────────────────────────────────────────────────────────────────┤
│ - product: Product                                                │
│ - quantity: number                                                │
│ - unit_price: number                                              │
│ - total_price: number                                             │
└─────────────────────────────────────────────────────────────────┘
            │ *
            │
            │ 1
┌─────────────────────────────────────────────────────────────────┐
│                            Product                                │
├─────────────────────────────────────────────────────────────────┤
│ - price: number                                                   │
│ - current_price: number                                           │
│ - quantity_in_stock: number                                       │
│ - activePromotion?: Promotion                                     │
└─────────────────────────────────────────────────────────────────┘
            │ 0..*
            │
            │ 0..1
┌─────────────────────────────────────────────────────────────────┐
│                           Promotion                               │
├─────────────────────────────────────────────────────────────────┤
│ - discount_percentage: number                                     │
│ - start_date: datetime                                            │
│ - end_date: datetime                                              │
│ - product?: Product (null => global)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                           Invoice                                 │
├─────────────────────────────────────────────────────────────────┤
│ - subtotal: number                                                │
│ - tax_amount: number                                              │
│ - total_amount: number                                            │
│ - status: string                                                  │
└─────────────────────────────────────────────────────────────────┘
            │ 1
            │
            │ *
┌─────────────────────────────────────────────────────────────────┐
│                         InvoiceItem                               │
├─────────────────────────────────────────────────────────────────┤
│ - product_name: string                                            │
│ - quantity: number                                                │
│ - unit_price: number                                              │
│ - total_price: number                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Notification                              │
├─────────────────────────────────────────────────────────────────┤
│ - user?: User (null => global)                                    │
│ - title: string                                                   │
│ - message: string                                                 │
│ - type: info | promotion | alert | system                         │
│ - is_read: boolean                                                │
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

## Activity Diagram - Promotion Notification Flow

```
        ┌───────────────┐
        │ Admin Creates │
        │  Promotion    │
        └───────┬───────┘
              │
        ┌───────▼────────┐
        │ Promotion Saved│
        └───────┬────────┘
              │
        ┌───────▼────────┐
        │ Notification   │
        │ (global)       │
        └───────┬────────┘
              │
        ┌───────▼────────┐
        │ User Fetches   │
        │ Notifications  │
        └───────┬────────┘
              │
        ┌───────▼────────┐
        │ Badge Updates  │
        └───────┬────────┘
              │
             ┌──▼──┐
             │ End │
             └─────┘
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
