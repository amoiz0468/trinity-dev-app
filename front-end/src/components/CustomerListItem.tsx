import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Customer } from '../types';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';
import { formatCurrency, formatDate } from '../utils/format';

interface CustomerListItemProps {
    customer: Customer;
    onPress?: (customer: Customer) => void;
}

const CustomerListItem: React.FC<CustomerListItemProps> = ({
    customer,
    onPress,
}) => {
    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress?.(customer)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                    </Text>
                </View>
                <View style={styles.customerInfo}>
                    <Text style={styles.name}>
                        {customer.firstName} {customer.lastName}
                    </Text>
                    <Text style={styles.email} numberOfLines={1}>
                        {customer.email}
                    </Text>
                    {customer.phone && (
                        <Text style={styles.phone}>{customer.phone}</Text>
                    )}
                </View>
            </View>

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{customer.totalOrders}</Text>
                    <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: COLORS.primary }]}>
                        {formatCurrency(customer.lifetimeValue)}
                    </Text>
                    <Text style={styles.statLabel}>Lifetime Value</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>Joined:</Text>
                    <Text style={styles.footerValue}>{formatDate(customer.createdAt)}</Text>
                </View>
                {customer.lastOrderDate && (
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>Last Order:</Text>
                        <Text style={styles.footerValue}>{formatDate(customer.lastOrderDate)}</Text>
                    </View>
                )}
            </View>
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
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    avatarText: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '700',
        color: COLORS.surface,
    },
    customerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    email: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    phone: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    stats: {
        flexDirection: 'row',
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    divider: {
        width: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.md,
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.sm,
    },
    footerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    footerLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    footerValue: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text,
        fontWeight: '500',
    },
});

export default CustomerListItem;
