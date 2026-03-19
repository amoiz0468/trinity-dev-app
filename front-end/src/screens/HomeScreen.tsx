import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Image } from 'react-native';
import { MainTabParamList, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import ProductService from '../services/productService';

type HomeScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout } = useAuth();
  const { cart, clearCart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const products = await ProductService.getFeaturedProducts(10);
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error loading featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeaturedProducts();
    setRefreshing(false);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails' as any, { productId: product.id } as any);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              await clearCart();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const QuickActionCard: React.FC<{
    icon: string;
    title: string;
    onPress: () => void;
  }> = ({ icon, title, onPress }) => (
    <TouchableOpacity 
      style={styles.actionCard} 
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityHint={`Open ${title}`}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading message="Loading..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeftContainer}>
          <Image
            source={require('../../assets/trinity_logo.png')}
            style={styles.logo}
          />
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>Hello, {user?.firstName || 'Guest'}!</Text>
            <Text style={styles.subtitle}>Find your groceries</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Cart' as never)}
            accessibilityLabel={`Shopping cart, ${cart.totalItems} items`}
            accessibilityRole="button"
            accessibilityHint="Go to cart"
          >
            <Text style={styles.headerIconText}>🛒</Text>
            {cart.totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityLabel="Logout"
            accessibilityRole="button"
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <QuickActionCard
              icon="📷"
              title="Scan Product"
              onPress={() => navigation.navigate('Scan' as never)}
            />
            <QuickActionCard
              icon="🛒"
              title="My Cart"
              onPress={() => navigation.navigate('Cart' as never)}
            />
            <QuickActionCard
              icon="📜"
              title="Order History"
              onPress={() => navigation.navigate('History' as never)}
            />
            <QuickActionCard
              icon="👤"
              title="My Profile"
              onPress={() => navigation.navigate('Profile' as never)}
            />
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={handleProductPress}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No featured products available</Text>
          )}
        </View>

        {/* Promotional Banner */}
        <View style={styles.promoBanner}>
          <Text style={styles.promoIcon}>🎉</Text>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Special Offers!</Text>
            <Text style={styles.promoText}>
              Get up to 30% off on selected items
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 45,
    height: 45,
    marginRight: SPACING.md,
    borderRadius: 12,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginLeft: 12,
  },
  logoutButtonText: {
    color: '#F87171',
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerIconText: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    aspectRatio: 1.1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: SPACING.lg,
    margin: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.md,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.text,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: SPACING.xl,
    fontStyle: 'italic',
  },
  promoBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.xxl,
    padding: SPACING.xl,
    borderRadius: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  promoIcon: {
    fontSize: 44,
    marginRight: SPACING.lg,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  promoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});

export default HomeScreen;
