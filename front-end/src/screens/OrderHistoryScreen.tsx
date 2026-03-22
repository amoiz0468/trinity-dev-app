import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Order } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import OrderService from '../services/orderService';
import Loading from '../components/Loading';
import EmptyState from '../components/EmptyState';
import { SPACING, TYPOGRAPHY } from '../constants';
import { formatCurrency, formatDateTime } from '../utils/format';

const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const ordersData = await OrderService.getOrderHistory();
      setOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return theme.success;
      case 'PROCESSING':
        return theme.secondary;
      case 'CANCELLED':
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('History' as never)}
      accessibilityLabel={`Order #${item.id.slice(0, 8)}, status: ${item.status}, total: ${formatCurrency(item.totalAmount)}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view order details"
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id.slice(0, 8)}</Text>
          <Text style={styles.orderDate}>{formatDateTime(item.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <Text style={styles.itemCount}>
          {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
        </Text>
        <Text style={styles.orderTotal}>{formatCurrency(item.totalAmount)}</Text>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.deliveryAddress}>
          {item.billingInfo.address}, {item.billingInfo.city}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading message="Loading order history..." />;
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="📦"
        title="No Orders Yet"
        message="Your order history will appear here"
        actionLabel="Start Shopping"
        onAction={() => navigation.navigate('Home' as never)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />
    </View>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0 : 0.05,
    shadowRadius: 5,
    elevation: isDark ? 0 : 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  orderId: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.text,
  },
  orderDate: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: theme.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    letterSpacing: 0.5,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  itemCount: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: theme.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  orderTotal: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: theme.primary,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    paddingTop: SPACING.md,
  },
  deliveryAddress: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: theme.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});

export default OrderHistoryScreen;
