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
      accessibilityLabel={`Product: ${product.name} by ${product.brand}. Price: ${formatCurrency(product.price)}. ${product.stock > 0 ? 'In stock' : 'Out of stock'}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view product details"
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={product.name}
        />
      </View>
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
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: SPACING.lg,
  },
  name: {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: COLORS.primary,
  },
  stockBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  lowStockBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  stockText: {
    fontSize: 12,
    color: COLORS.text,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

export default ProductCard;
