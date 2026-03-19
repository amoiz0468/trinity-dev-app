# Trinity Mobile App - Grocery Shopping Application

A comprehensive React Native mobile application for grocery shopping with barcode scanning, cart management, and PayPal integration.

## Features

- **Authentication**: Secure login and signup with JWT
- **Home Dashboard**: Intuitive navigation and promotional sections
- **Barcode Scanner**: Real-time product scanning using device camera
- **Product Display**: Detailed product information with images and nutrition facts
- **Cart Management**: Add, remove, and modify cart items with real-time totals
- **Payment Integration**: Secure PayPal payment processing
- **Purchase History**: View past transactions and order details

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State Management**: React Context API
- **API Communication**: Axios with JWT authentication
- **Camera**: Expo Camera & Barcode Scanner
- **Payment**: PayPal SDK
- **Testing**: Jest with React Native Testing Library
- **Architecture**: MVVM Pattern

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio with emulator (for Android development)

## Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Project Structure

```
trinity-mobile-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # Application screens
│   ├── navigation/          # Navigation configuration
│   ├── services/            # API services and utilities
│   ├── contexts/            # React Context providers
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper functions
│   ├── constants/           # App constants and config
│   └── __tests__/           # Test files
├── assets/                  # Images, fonts, and static files
├── docs/                    # Documentation and UML diagrams
└── App.tsx                  # Application entry point
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## API Configuration

Create a `.env` file in `front-end/` (or copy from `.env.example`).

For most cases, leave API vars commented and the app will auto-detect your PC IP from Expo host:

```env
# EXPO_PUBLIC_API_BASE_URL=http://<YOUR_PC_IP>:8000/api
# API_BASE_URL=http://<YOUR_PC_IP>:8000/api
```

Common explicit values:

```env
# Android emulator
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000/api
API_BASE_URL=http://10.0.2.2:8000/api

# Physical device on same Wi-Fi
# EXPO_PUBLIC_API_BASE_URL=http://<YOUR_PC_IP>:8000/api
# API_BASE_URL=http://<YOUR_PC_IP>:8000/api

PAYPAL_CLIENT_ID=your_paypal_client_id
```



## Documentation

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [API Integration Guide](./docs/API_INTEGRATION.md)
- [Testing Strategy](./docs/TESTING.md)
- [UML Diagrams](./docs/UML_DIAGRAMS.md)

## Contributing

1. Follow the established code architecture (MVVM)
2. Write unit tests for new features
3. Maintain code coverage above 20%
4. Follow TypeScript best practices
5. Document complex logic


