import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Product } from '../types';
import { useCart } from '../contexts/CartContext';
import ProductService from '../services/productService';
import Button from '../components/Button';
import Loading from '../components/Loading';
import { COLORS, SPACING, TYPOGRAPHY, SUCCESS_MESSAGES } from '../constants';
import { formatCurrency } from '../utils/format';

type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;
type ProductDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetails'>;

const ProductDetailsScreen: React.FC = () => {
  const route = useRoute<ProductDetailsRouteProp>();
  const navigation = useNavigation<ProductDetailsNavigationProp>();
  const { addToCart, isInCart, getItemQuantity } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [route.params.productId]);

  const loadProduct = async () => {
    try {
      const productData = await ProductService.getProductById(route.params.productId);
      setProduct(productData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load product', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    try {
      addToCart(product, quantity);
      Alert.alert('Success', SUCCESS_MESSAGES.PRODUCT_ADDED, [
        { text: 'Continue Shopping', onPress: () => navigation.goBack() },
        { text: 'View Cart', onPress: () => navigation.navigate('Cart' as never) },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  if (loading) {
    return <Loading message="Loading product..." />;
  }

  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Product not found</Text>
      </View>
    );
  }

  const inCart = isInCart(product.id);
  const cartQuantity = getItemQuantity(product.id);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.details}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>{product.name}</Text>
              <Text style={styles.brand}>{product.brand}</Text>
            </View>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{product.category}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Stock</Text>
              <Text style={[styles.infoValue, product.stock < 10 && styles.lowStock]}>
                {product.stock} available
              </Text>
            </View>
          </View>

          {product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
          )}

          {product.nutritionalInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutritional Information</Text>
              <Text style={styles.servingSize}>
                Per {product.nutritionalInfo.servingSize}
              </Text>
              <View style={styles.nutritionGrid}>
                <NutritionItem
                  label="Calories"
                  value={`${product.nutritionalInfo.calories} kcal`}
                />
                <NutritionItem
                  label="Protein"
                  value={`${product.nutritionalInfo.protein}g`}
                />
                <NutritionItem
                  label="Carbs"
                  value={`${product.nutritionalInfo.carbohydrates}g`}
                />
                <NutritionItem
                  label="Fat"
                  value={`${product.nutritionalInfo.fat}g`}
                />
              </View>
            </View>
          )}

          {inCart && (
            <View style={styles.inCartNotice}>
              <Text style={styles.inCartText}>
                ✓ {cartQuantity} in cart
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity:</Text>
          <View style={styles.quantityControls}>
            <Button
              title="−"
              onPress={decrementQuantity}
              disabled={quantity <= 1}
              size="small"
              style={styles.quantityButton}
            />
            <Text style={styles.quantity}>{quantity}</Text>
            <Button
              title="+"
              onPress={incrementQuantity}
              disabled={quantity >= product.stock}
              size="small"
              style={styles.quantityButton}
            />
          </View>
        </View>
        <Button
          title="Add to Cart"
          onPress={handleAddToCart}
          fullWidth
          size="large"
          disabled={product.stock === 0}
        />
      </View>
    </View>
  );
};

const NutritionItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.nutritionItem}>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={styles.nutritionValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.surface,
  },
  details: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  brand: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  price: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  lowStock: {
    color: COLORS.warning,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  servingSize: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  nutritionItem: {
    width: '50%',
    padding: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  nutritionLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
  nutritionValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  inCartNotice: {
    backgroundColor: COLORS.success + '20',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  inCartText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.success,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  quantityLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 40,
    minHeight: 40,
  },
  quantity: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: SPACING.lg,
    minWidth: 30,
    textAlign: 'center',
  },
});

export default ProductDetailsScreen;
