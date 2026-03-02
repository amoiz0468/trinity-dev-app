import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CartItem as CartItemType } from '../types';
import { COLORS, SPACING, LAYOUT, TYPOGRAPHY } from '../constants';
import { formatCurrency } from '../utils/format';

interface CartItemProps {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) => {
  const { product, quantity } = item;
  const subtotal = product.price * quantity;

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>

        <View style={styles.footer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={onDecrease}
            >
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{quantity}</Text>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                quantity >= product.stock && styles.quantityButtonDisabled,
              ]}
              onPress={onIncrease}
              disabled={quantity >= product.stock}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtotal}>{formatCurrency(subtotal)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  content: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: SPACING.sm,
  },
  brand: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  price: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quantityButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.3,
  },
  quantityButtonText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '700',
  },
  quantity: {
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    minWidth: 35,
    textAlign: 'center',
  },
  subtotal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
});

export default CartItem;
