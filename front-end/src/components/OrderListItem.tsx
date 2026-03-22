import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order, OrderStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';
import { formatCurrency, formatDateTime } from '../utils/format';

interface OrderListItemProps {
    order: Order;
    onPress?: (order: Order) => void;
    onStatusChange?: (orderId: string, status: OrderStatus) => void;
    showActions?: boolean;
}

const OrderListItem: React.FC<OrderListItemProps> = ({
    order,
    onPress,
    onStatusChange,
    showActions = false,
}) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.COMPLETED:
                return theme.success;
            case OrderStatus.PROCESSING:
                return theme.secondary;
            case OrderStatus.PENDING:
                return theme.warning;
            case OrderStatus.CANCELLED:
                return theme.error;
            default:
                return theme.textSecondary;
        }
    };

    const statusColor = getStatusColor(order.status);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress?.(order)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>#{String(order.id || '').slice(0, 8)}</Text>
                    <Text style={styles.customerName}>
                        {order.billingInfo.firstName} {order.billingInfo.lastName}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                        {order.status}
                    </Text>
                </View>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Date:</Text>
                    <Text style={styles.value}>{formatDateTime(order.createdAt)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Items:</Text>
                    <Text style={styles.value}>{order.items?.length || 0}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={styles.label}>Total:</Text>
                    <Text style={[styles.value, styles.totalAmount]}>
                        {formatCurrency(order.totalAmount)}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.address} numberOfLines={1}>
                    📍 {order.billingInfo.city}, {order.billingInfo.zipCode}
                </Text>
            </View>

            {showActions && onStatusChange && order.status !== OrderStatus.COMPLETED && (
                <View style={styles.actions}>
                    {order.status === OrderStatus.PENDING && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.secondary }]}
                            onPress={() => onStatusChange(order.id, OrderStatus.PROCESSING)}
                        >
                            <Text style={styles.actionButtonText}>Process</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === OrderStatus.PROCESSING && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: theme.success }]}
                            onPress={() => onStatusChange(order.id, OrderStatus.COMPLETED)}
                        >
                            <Text style={styles.actionButtonText}>Complete</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.error }]}
                        onPress={() => onStatusChange(order.id, OrderStatus.CANCELLED)}
                    >
                        <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    container: {
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: 16,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        color: theme.text,
        marginBottom: 2,
    },
    customerName: {
        fontSize: 13,
        color: theme.textSecondary,
        fontFamily: TYPOGRAPHY.fontFamily.medium,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        textTransform: 'uppercase',
    },
    details: {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    label: {
        fontSize: 13,
        color: theme.textSecondary,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
    value: {
        fontSize: 13,
        color: theme.text,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    totalAmount: {
        color: theme.primary,
        fontSize: 15,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingTop: SPACING.md,
        borderStyle: 'dashed',
    },
    address: {
        fontSize: 13,
        color: theme.textSecondary,
        fontFamily: TYPOGRAPHY.fontFamily.medium,
    },
    actions: {
        flexDirection: 'row',
        marginTop: SPACING.lg,
        gap: SPACING.md,
    },
    actionButton: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
});

export default OrderListItem;
