import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order, OrderStatus } from '../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
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
    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.COMPLETED:
                return COLORS.success;
            case OrderStatus.PROCESSING:
                return COLORS.secondary;
            case OrderStatus.PENDING:
                return COLORS.warning;
            case OrderStatus.CANCELLED:
                return COLORS.error;
            default:
                return COLORS.textSecondary;
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress?.(order)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
                    <Text style={styles.customerName}>
                        {order.billingInfo.firstName} {order.billingInfo.lastName}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
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
                            style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
                            onPress={() => onStatusChange(order.id, OrderStatus.PROCESSING)}
                        >
                            <Text style={styles.actionButtonText}>Process</Text>
                        </TouchableOpacity>
                    )}
                    {order.status === OrderStatus.PROCESSING && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: COLORS.success }]}
                            onPress={() => onStatusChange(order.id, OrderStatus.COMPLETED)}
                        >
                            <Text style={styles.actionButtonText}>Complete</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: COLORS.error }]}
                        onPress={() => onStatusChange(order.id, OrderStatus.CANCELLED)}
                    >
                        <Text style={styles.actionButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    customerName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 6,
    },
    statusText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: '600',
    },
    details: {
        marginBottom: SPACING.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    value: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
    totalAmount: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.sm,
    },
    address: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text,
    },
    actions: {
        flexDirection: 'row',
        marginTop: SPACING.sm,
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: COLORS.surface,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: '600',
    },
});

export default OrderListItem;
