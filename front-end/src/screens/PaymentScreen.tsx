import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import PaymentService from '../services/paymentService';
import OrderService from '../services/orderService';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { SPACING, TYPOGRAPHY, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { formatCurrency } from '../utils/format';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentNavigationProp = StackNavigationProp<RootStackParamList, 'Payment'>;

const PaymentScreen: React.FC = () => {
  const route = useRoute<PaymentRouteProp>();
  const navigation = useNavigation<PaymentNavigationProp>();
  const { cart, clearCart } = useCart();
  const { theme, isDark } = useTheme();
  const [processing, setProcessing] = useState(false);
  const [pendingPayPalOrderId, setPendingPayPalOrderId] = useState<string | null>(null);
  const [pendingApprovalUrl, setPendingApprovalUrl] = useState<string | null>(null);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const handlePayPalPayment = async () => {
    setProcessing(true);

    try {
      const order = await OrderService.getOrderById(route.params.orderId);

      const paymentData = await PaymentService.initiatePayment({
        orderId: order.id,
        amount: cart.totalAmount,
        currency: 'USD',
      });

      const links = Array.isArray(paymentData.links) ? paymentData.links : [];
      const approvalLink = links.find((link: any) =>
        ['approve', 'payer-action'].includes(String(link?.rel || '').toLowerCase())
      );
      const approvalUrl =
        approvalLink?.href ||
        (paymentData as any).approval_url ||
        (paymentData as any).approve_url ||
        (paymentData?.id
          ? `https://www.sandbox.paypal.com/checkoutnow?token=${paymentData.id}`
          : null) ||
        null;

      if (!approvalUrl) {
        const statusHint = paymentData?.status ? ` (status: ${paymentData.status})` : '';
        throw new Error(`Approval link not found in PayPal response${statusHint}`);
      }

      setPendingPayPalOrderId(paymentData.id);
      setPendingApprovalUrl(approvalUrl);
      setProcessing(false);
      await Linking.openURL(approvalUrl);

      Alert.alert(
        'Complete PayPal Approval',
        'After approving payment in the browser, return to the app and tap "I Approved Payment".'
      );

    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || ERROR_MESSAGES.PAYMENT_FAILED);
      setProcessing(false);
    }
  };

  const executePayment = async (paymentId: string) => {
    setProcessing(true);
    try {
      const paymentResponse = await PaymentService.executePayment(
        route.params.orderId,
        paymentId
      );

      if (paymentResponse.status === 'COMPLETED' || paymentResponse.status === 'APPROVED' || paymentResponse.success) {
        clearCart();
        setPendingPayPalOrderId(null);
        setPendingApprovalUrl(null);

        Alert.alert(
          'Payment Successful!',
          SUCCESS_MESSAGES.PAYMENT_SUCCESS,
          [
            {
              text: 'View Order',
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Main' as never } as any],
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.icon}>💳</Text>
          <Text style={styles.title}>Complete Payment</Text>
          <Text style={styles.subtitle}>
            Secure payment powered by PayPal
          </Text>

          <View 
            style={styles.amountContainer}
            accessibilityLabel={`Total amount: ${formatCurrency(cart.totalAmount)}`}
            accessibilityRole="summary"
          >
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
      </ScrollView>

      <View style={styles.footer}>
        {pendingPayPalOrderId ? (
          <>
            <Button
              title="I Approved Payment"
              onPress={() => executePayment(pendingPayPalOrderId)}
              loading={processing}
              fullWidth
              size="large"
              style={styles.payButton}
            />
            <Button
              title="Reopen PayPal"
              onPress={() => pendingApprovalUrl && Linking.openURL(pendingApprovalUrl)}
              variant="outline"
              fullWidth
              disabled={processing || !pendingApprovalUrl}
              style={styles.payButton}
            />
            <Button
              title="Cancel PayPal Flow"
              onPress={() => {
                setPendingPayPalOrderId(null);
                setPendingApprovalUrl(null);
              }}
              variant="outline"
              fullWidth
              disabled={processing}
              style={styles.payButton}
            />
          </>
        ) : (
          <Button
            title="Pay with PayPal"
            onPress={handlePayPalPayment}
            loading={processing}
            fullWidth
            size="large"
            style={styles.payButton}
          />
        )}

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

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: theme.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  amountContainer: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0 : 0.05,
    shadowRadius: 10,
    elevation: isDark ? 0 : 4,
  },
  amountLabel: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  amount: {
    fontSize: 42,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: theme.primary,
  },
  infoBox: {
    backgroundColor: theme.primary + '15',
    borderRadius: 12,
    padding: SPACING.lg,
    width: '100%',
  },
  infoText: {
    fontSize: 14,
    color: theme.text,
    marginBottom: SPACING.xs,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    lineHeight: 20,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.lg,
  },
  payButton: {
    marginBottom: SPACING.md,
  },
});

export default PaymentScreen;
