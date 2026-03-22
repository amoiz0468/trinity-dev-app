import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MainTabParamList, Product, Promotion, Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useTheme } from '../contexts/ThemeContext';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import PromotionBanner from '../components/PromotionBanner';
import RecommendationSection from '../components/RecommendationSection';
import NotificationCenter from '../components/NotificationCenter';
import { SPACING, TYPOGRAPHY } from '../constants';
import ProductService from '../services/productService';
import PromotionService from '../services/promotionService';
import NotificationService from '../services/notificationService';

type HomeScreenNavigationProp = StackNavigationProp<MainTabParamList, 'Home'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout } = useAuth();
  const { cart, clearCart } = useCart();
  const { theme, isDark, toggleTheme } = useTheme();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortByPrice, setSortByPrice] = useState<'none' | 'asc' | 'desc'>('none');
  const [categories, setCategories] = useState<string[]>(['All']);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity 
          onPress={toggleTheme} 
          style={{ marginRight: SPACING.md, padding: 8 }}
          accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          <Text style={{ fontSize: 20 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, isDark, toggleTheme]);

  useEffect(() => {
    loadProducts();
    loadPromotionsAndRecommendations();
    loadNotifications();
  }, [searchQuery, selectedCategory]);

  const loadProducts = async () => {
    try {
      const fetchedProducts = await ProductService.getProducts({
        search: searchQuery || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      });

      if (categories.length === 1 && !searchQuery && selectedCategory === 'All') {
        const uniqueCategories = Array.from(new Set(fetchedProducts.map(p => p.category).filter(Boolean)));
        setCategories(['All', ...uniqueCategories]);
      }

      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPromotionsAndRecommendations = async () => {
    try {
      const [fetchedPromos, fetchedRecs] = await Promise.all([
        PromotionService.getActivePromotions(),
        ProductService.getRecommendations(),
      ]);
      setPromotions(fetchedPromos);
      setRecommendedProducts(fetchedRecs);
    } catch (error) {
      console.error('Error loading extras:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const fetchedNotifications = await NotificationService.getNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await NotificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadProducts(),
      loadPromotionsAndRecommendations(),
      loadNotifications()
    ]);
    setRefreshing(false);
  };

  const getSortedProducts = () => {
    if (sortByPrice === 'none') return products;
    return [...products].sort((a, b) => 
      sortByPrice === 'asc' ? a.price - b.price : b.price - a.price
    );
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails' as any, { productId: product.id } as any);
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
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Promotions Banners */}
        {promotions.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.promotionsContainer}
          >
            {promotions.map(promo => (
              <PromotionBanner 
                key={promo.id} 
                promotion={promo} 
                onPress={(p) => p.productId && navigation.navigate('ProductDetails' as any, { productId: p.productId } as any)}
              />
            ))}
          </ScrollView>
        )}

        {/* Personalized Recommendations */}
        <RecommendationSection 
          products={recommendedProducts} 
          onProductPress={handleProductPress} 
        />

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
              icon="🔔"
              title={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
              onPress={() => setIsNotificationVisible(true)}
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

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Our Products</Text>
          </View>

          {/* Filters */}
          <View style={styles.filterContainer}>
            <View style={styles.searchWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipSelected]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextSelected]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sortContainer}>
              <TouchableOpacity style={styles.sortButton} onPress={() => setSortByPrice(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none')}>
                <Text style={styles.sortText}>
                  Price: {sortByPrice === 'none' ? 'Default' : sortByPrice === 'asc' ? 'Low to High ↑' : 'High to Low ↓'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {getSortedProducts().length > 0 ? (
            getSortedProducts().map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={handleProductPress}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>No products found matching filters</Text>
          )}
        </View>

      </ScrollView>

      <NotificationCenter
        isVisible={isNotificationVisible}
        onClose={() => setIsNotificationVisible(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </View>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.background,
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
    color: theme.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    marginLeft: 8,
  },
  headerIconText: {
    fontSize: 22,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.background,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: TYPOGRAPHY.fontFamily.black,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1,
    borderColor: theme.background,
  },
  promotionsContainer: {
    marginVertical: SPACING.md,
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
    color: theme.text,
    letterSpacing: -0.2,
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
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 1)',
    borderRadius: 24,
    padding: SPACING.lg,
    margin: SPACING.xs,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0 : 0.05,
    shadowRadius: 10,
    elevation: isDark ? 0 : 2,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.md,
  },
  actionTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.text,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.textSecondary,
    fontSize: 16,
    marginTop: SPACING.xl,
    fontStyle: 'italic',
  },
  filterContainer: {
    marginBottom: SPACING.lg,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: theme.text,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  categoryChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  },
  categoryChipSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  categoryChipText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  categoryChipTextSelected: {
    color: '#FFF',
  },
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  sortButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  },
  sortText: {
    color: theme.textSecondary,
    fontSize: 13,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});

export default HomeScreen;
