import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Product } from '../types';
import { COLORS, SPACING, LAYOUT, TYPOGRAPHY } from '../constants';
import { formatCurrency } from '../utils/format';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  style?: ViewStyle;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, style }) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: product.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.brand} numberOfLines={1}>
          {product.brand}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          <View style={[styles.stockBadge, product.stock < 10 && styles.lowStockBadge]}>
            <Text style={styles.stockText}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: LAYOUT.borderRadius,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: LAYOUT.shadowOpacity,
    shadowRadius: 4,
    marginBottom: SPACING.md,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  brand: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.primary,
  },
  stockBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: LAYOUT.borderRadius,
  },
  lowStockBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  stockText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text,
    fontWeight: '500',
  },
});

export default ProductCard;
