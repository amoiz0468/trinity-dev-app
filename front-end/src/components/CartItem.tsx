import React, { useMemo } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { CartItem as CartItemType } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';
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
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

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

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderRadius: 24,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0 : 0.05,
    shadowRadius: 5,
    elevation: isDark ? 0 : 2,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.text,
    marginRight: SPACING.sm,
  },
  brand: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  price: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  removeButton: {
    padding: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    fontSize: 12,
    color: theme.error,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  quantity: {
    paddingHorizontal: 8,
    fontSize: 15,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.text,
    minWidth: 30,
    textAlign: 'center',
  },
  subtotal: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: theme.primary,
  },
});

export default CartItem;
