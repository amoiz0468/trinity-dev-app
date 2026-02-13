import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, BillingInfo } from '../types';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import OrderService from '../services/orderService';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { formatCurrency } from '../utils/format';
import {
  validateRequired,
  validateName,
  validateZipCode,
  validateAddress,
  validateEmail,
} from '../utils/validation';

type CheckoutScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Checkout'>;

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: '',
    zipCode: '',
    city: '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof BillingInfo, value: string) => {
    setBillingInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!validateName(billingInfo.firstName)) {
      newErrors.firstName = 'Valid first name is required';
    }
    if (!validateName(billingInfo.lastName)) {
      newErrors.lastName = 'Valid last name is required';
    }
    if (!validateAddress(billingInfo.address)) {
      newErrors.address = 'Valid address is required';
    }
    if (!validateZipCode(billingInfo.zipCode)) {
      newErrors.zipCode = 'Valid zip code is required';
    }
    if (!validateRequired(billingInfo.city)) {
      newErrors.city = 'City is required';
    }
    if (billingInfo.email && !validateEmail(billingInfo.email)) {
      newErrors.email = 'Valid email is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Create order
      const order = await OrderService.createOrder(cart.items, billingInfo);
      
      // Navigate to payment screen
      navigation.navigate('Payment', { orderId: order.id });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          
          <Input
            label="First Name"
            value={billingInfo.firstName}
            onChangeText={(value) => updateField('firstName', value)}
            placeholder="Enter first name"
            autoCapitalize="words"
            error={errors.firstName}
          />

          <Input
            label="Last Name"
            value={billingInfo.lastName}
            onChangeText={(value) => updateField('lastName', value)}
            placeholder="Enter last name"
            autoCapitalize="words"
            error={errors.lastName}
          />

          <Input
            label="Address"
            value={billingInfo.address}
            onChangeText={(value) => updateField('address', value)}
            placeholder="Enter street address"
            autoCapitalize="words"
            error={errors.address}
          />

          <View style={styles.row}>
            <Input
              label="Zip Code"
              value={billingInfo.zipCode}
              onChangeText={(value) => updateField('zipCode', value)}
              placeholder="Zip code"
              keyboardType="default"
              style={styles.halfInput}
              error={errors.zipCode}
            />

            <Input
              label="City"
              value={billingInfo.city}
              onChangeText={(value) => updateField('city', value)}
              placeholder="City"
              autoCapitalize="words"
              style={styles.halfInput}
              error={errors.city}
            />
          </View>

          <Input
            label="Email (Optional)"
            value={billingInfo.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="Email for receipt"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{cart.totalItems}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(cart.totalAmount)}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(cart.totalAmount)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Proceed to Payment"
          onPress={handleProceedToPayment}
          loading={loading}
          fullWidth
          size="large"
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  halfInput: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    fontWeight: '600',
  },
  totalRow: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  footer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default CheckoutScreen;
