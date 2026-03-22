import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';

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
    color,
}) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const getTrendColor = () => {
        if (!trend) return theme.textSecondary;
        return trend >= 0 ? theme.success : theme.error;
    };

    const getTrendIcon = () => {
        if (!trend) return '';
        return trend >= 0 ? '📈' : '📉';
    };

    const displayColor = color || theme.primary;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.icon}>{icon}</Text>
                {trend !== undefined && (
                    <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + (isDark ? '30' : '15') }]}>
                        <Text style={[styles.trendText, { color: getTrendColor() }]}>
                            {getTrendIcon()} {Math.abs(trend)}%
                        </Text>
                    </View>
                )}
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={[styles.value, { color: displayColor }]}>{value}</Text>

            {trendLabel && (
                <Text style={styles.trendLabel}>{trendLabel}</Text>
            )}
        </View>
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
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    icon: {
        fontSize: 32,
    },
    trendBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    trendText: {
        fontSize: 12,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    title: {
        fontSize: 14,
        color: theme.textSecondary,
        marginBottom: 4,
        fontFamily: TYPOGRAPHY.fontFamily.medium,
    },
    value: {
        fontSize: 28,
        fontFamily: TYPOGRAPHY.fontFamily.black,
        marginBottom: 4,
    },
    trendLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
    },
});

export default StatCard;
