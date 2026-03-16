import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList } from '../types';
import { useCart } from '../contexts/CartContext';
import CartItem from '../components/CartItem';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { formatCurrency } from '../utils/format';

type CartScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Cart'>;

const CartScreen: React.FC = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();

  const handleIncrease = (productId: string) => {
    const item = cart.items.find(i => i.product.id === productId);
    if (item) {
      try {
        addToCart(item.product, 1);
      } catch (error: any) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleDecrease = (productId: string) => {
    const item = cart.items.find(i => i.product.id === productId);
    if (item) {
      if (item.quantity > 1) {
        updateQuantity(productId, item.quantity - 1);
      } else {
        handleRemove(productId);
      }
    }
  };

  const handleRemove = (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(productId),
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart first');
      return;
    }
    navigation.navigate('Checkout' as never);
  };

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon="🛒"
        title="Your Cart is Empty"
        message="Start shopping and add items to your cart"
        actionLabel="Browse Products"
        onAction={() => navigation.navigate('Home' as never)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsContainer}>
          {cart.items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onIncrease={() => handleIncrease(item.product.id)}
              onDecrease={() => handleDecrease(item.product.id)}
              onRemove={() => handleRemove(item.product.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View 
          style={styles.summaryRow}
          accessibilityLabel={`Total items: ${cart.totalItems}, Subtotal: ${formatCurrency(cart.totalAmount)}`}
          accessibilityRole="summary"
        >
          <Text style={styles.summaryLabel}>Items ({cart.totalItems})</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(cart.totalAmount)}
          </Text>
        </View>

        <View 
          style={styles.totalRow}
          accessibilityLabel={`Grand Total: ${formatCurrency(cart.totalAmount)}`}
        >
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(cart.totalAmount)}
          </Text>
        </View>

        <Button
          title="Proceed to Checkout"
          onPress={handleCheckout}
          fullWidth
          size="large"
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
  },
  itemsContainer: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  footer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  summaryValue: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  totalLabel: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.text,
  },
  totalValue: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: COLORS.primary,
  },
});

export default CartScreen;
