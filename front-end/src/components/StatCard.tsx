import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

interface StatCardProps {
    icon: string;
    title: string;
    value: string | number;
    trend?: number;
    trendLabel?: string;
    color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    title,
    value,
    trend,
    trendLabel,
    color = COLORS.primary,
}) => {
    const getTrendColor = () => {
        if (!trend) return COLORS.textSecondary;
        return trend >= 0 ? COLORS.success : COLORS.error;
    };

    const getTrendIcon = () => {
        if (!trend) return '';
        return trend >= 0 ? '📈' : '📉';
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.icon}>{icon}</Text>
                {trend !== undefined && (
                    <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
                        <Text style={[styles.trendText, { color: getTrendColor() }]}>
                            {getTrendIcon()} {Math.abs(trend)}%
                        </Text>
                    </View>
                )}
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.value, { color }]}>{value}</Text>

            {trendLabel && (
                <Text style={styles.trendLabel}>{trendLabel}</Text>
            )}
        </View>
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
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    icon: {
        fontSize: 32,
    },
    trendBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 6,
    },
    trendText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: '600',
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    value: {
        fontSize: TYPOGRAPHY.fontSize.xxl,
        fontWeight: '700',
        marginBottom: SPACING.xs,
    },
    trendLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
});

export default StatCard;
