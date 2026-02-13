import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useCart } from '../contexts/CartContext';
import PaymentService from '../services/paymentService';
import OrderService from '../services/orderService';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { COLORS, SPACING, TYPOGRAPHY, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { formatCurrency } from '../utils/format';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

/**
 * Payment Screen
 * Handles PayPal payment integration
 * Note: In a real app, you would use react-native-paypal SDK
 * This is a simplified version showing the flow
 */
const PaymentScreen: React.FC = () => {
  const route = useRoute<PaymentRouteProp>();
  const navigation = useNavigation<PaymentNavigationProp>();
  const { cart, clearCart } = useCart();
  const [processing, setProcessing] = useState(false);

  const handlePayPalPayment = async () => {
    setProcessing(true);
    
    try {
      const order = await OrderService.getOrderById(route.params.orderId);
      
      // Initialize PayPal payment
      const paymentData = await PaymentService.initiatePayment({
        amount: cart.totalAmount,
        currency: 'USD',
        orderId: order.id,
        billingInfo: order.billingInfo,
      });

      // In a real app, you would open PayPal SDK here
      // For now, we'll simulate the payment flow
      if (Platform.OS === 'web') {
        // Open PayPal approval URL in browser
        await Linking.openURL(paymentData.approvalUrl);
      } else {
        // On mobile, use PayPal SDK or WebView
        // This is a simplified simulation
        await simulatePayPalApproval(paymentData.paymentId);
      }
      
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || ERROR_MESSAGES.PAYMENT_FAILED);
      setProcessing(false);
    }
  };

  const simulatePayPalApproval = async (paymentId: string) => {
    // Simulate user approval
    Alert.alert(
      'PayPal Payment',
      'In a real app, PayPal SDK would handle this. Proceed with payment?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setProcessing(false),
        },
        {
          text: 'Pay',
          onPress: () => executePayment(paymentId, 'simulated-payer-id'),
        },
      ]
    );
  };

  const executePayment = async (paymentId: string, payerId: string) => {
    try {
      // Execute the payment
      const paymentResponse = await PaymentService.executePayment(paymentId, payerId);
      
      if (paymentResponse.success) {
        // Update order status
        await OrderService.updateOrderStatus(
          route.params.orderId,
          'COMPLETED' as any
        );
        
        // Clear cart
        clearCart();
        
        // Show success message
        Alert.alert(
          'Payment Successful!',
          SUCCESS_MESSAGES.PAYMENT_SUCCESS,
          [
            {
              text: 'View Order',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'Main' },
                    { name: 'OrderConfirmation', params: { orderId: route.params.orderId } } as any,
                  ],
                });
              },
            },
          ]
        );
      } else {
        throw new Error(paymentResponse.message || 'Payment failed');
      }
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || ERROR_MESSAGES.PAYMENT_FAILED);
    } finally {
      setProcessing(false);
    }
  };

  if (processing) {
    return <Loading message="Processing payment..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>💳</Text>
        <Text style={styles.title}>Complete Payment</Text>
        <Text style={styles.subtitle}>
          Secure payment powered by PayPal
        </Text>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amount}>{formatCurrency(cart.totalAmount)}</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Your payment information is secure and encrypted
          </Text>
          <Text style={styles.infoText}>
            ✓ Protected by PayPal Buyer Protection
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          title="Pay with PayPal"
          onPress={handlePayPalPayment}
          loading={processing}
          fullWidth
          size="large"
          style={styles.payButton}
        />
        
        <Button
          title="Cancel"
          onPress={() => navigation.goBack()}
          variant="outline"
          fullWidth
          disabled={processing}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  icon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  amountContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    width: '100%',
  },
  amountLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  amount: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoBox: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 8,
    padding: SPACING.md,
    width: '100%',
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payButton: {
    marginBottom: SPACING.md,
  },
});

export default PaymentScreen;
