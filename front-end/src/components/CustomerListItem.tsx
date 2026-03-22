import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Customer } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';
import { formatCurrency, formatDate } from '../utils/format';

interface CustomerListItemProps {
    customer: Customer;
    onPress?: (customer: Customer) => void;
    onDelete?: (customerId: string) => void;
}

const CustomerListItem: React.FC<CustomerListItemProps> = ({
    customer,
    onPress,
    onDelete,
}) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress?.(customer)}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <View style={styles.leftContent}>
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
                {onDelete && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            onDelete(customer.id);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.deleteIconText}>🗑️</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{customer.totalOrders}</Text>
                    <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: theme.primary }]}>
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

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    container: {
        backgroundColor: theme.surface,
        borderRadius: 16,
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
    header: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftContent: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: theme.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
        shadowColor: theme.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    avatarText: {
        fontSize: 18,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        color: '#FFFFFF',
    },
    customerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        color: theme.text,
        marginBottom: 2,
    },
    email: {
        fontSize: 13,
        color: theme.textSecondary,
        fontFamily: TYPOGRAPHY.fontFamily.medium,
        marginBottom: 2,
    },
    phone: {
        fontSize: 13,
        color: theme.textSecondary,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
    deleteButton: {
        justifyContent: 'center',
        paddingLeft: SPACING.md,
    },
    deleteIconText: {
        fontSize: 20,
    },
    stats: {
        flexDirection: 'row',
        backgroundColor: theme.background,
        borderRadius: 12,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: theme.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: theme.border,
        marginHorizontal: SPACING.md,
    },
    statValue: {
        fontSize: 18,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        color: theme.text,
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: theme.textSecondary,
        fontFamily: TYPOGRAPHY.fontFamily.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingTop: SPACING.sm,
        marginTop: SPACING.xs,
    },
    footerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    footerLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
    footerValue: {
        fontSize: 12,
        color: theme.text,
        fontFamily: TYPOGRAPHY.fontFamily.medium,
    },
});

export default CustomerListItem;
