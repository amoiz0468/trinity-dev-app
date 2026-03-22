import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { setupGlobalErrorHandler } from './src/utils/logger';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Setup global error handling
setupGlobalErrorHandler();

const DynamicStatusBar = () => {
  const { themeName } = useTheme();
  return <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />;
};

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <SafeAreaProvider>
          <AuthProvider>
            <CartProvider>
              <AppNavigator />
              <DynamicStatusBar />
            </CartProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
