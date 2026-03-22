import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Product } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';
import { formatCurrency } from '../utils/format';

interface AdminProductListItemProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (productId: string) => void;
}

const AdminProductListItem: React.FC<AdminProductListItemProps> = ({
    product,
    onEdit,
    onDelete,
}) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    return (
        <View style={styles.container}>
            <Image
                source={{ uri: product.imageUrl || 'https://via.placeholder.com/100' }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.brand}>{product.brand}</Text>
                <View style={styles.statsRow}>
                    <Text style={styles.price}>{formatCurrency(product.price)}</Text>
                    <View style={[
                        styles.stockBadge,
                        product.stock < 10 ? styles.stockLow : styles.stockOk
                    ]}>
                        <Text style={[
                            styles.stockText,
                            { color: product.stock < 10 ? theme.error : theme.success }
                        ]}>
                            {product.stock} in stock
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onEdit(product)}
                >
                    <Text style={styles.actionIcon}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => onDelete(product.id)}
                >
                    <Text style={styles.actionIcon}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0 : 0.03,
        shadowRadius: 5,
        elevation: isDark ? 0 : 2,
    },
    image: {
        width: 65,
        height: 65,
        borderRadius: 12,
        backgroundColor: theme.background,
    },
    info: {
        flex: 1,
        marginLeft: SPACING.md,
        paddingRight: SPACING.lg,
    },
    name: {
        fontSize: 16,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        color: theme.text,
    },
    brand: {
        fontSize: 12,
        color: theme.textSecondary,
        marginTop: 2,
        fontFamily: TYPOGRAPHY.fontFamily.medium,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        flexWrap: 'wrap',
    },
    price: {
        fontSize: 15,
        fontFamily: TYPOGRAPHY.fontFamily.black,
        color: theme.primary,
        marginRight: SPACING.md,
    },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    stockLow: {
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    },
    stockOk: {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
    },
    stockText: {
        fontSize: 11,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: theme.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    deleteButton: {
        backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
        borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
    },
    actionIcon: {
        fontSize: 16,
    },
});

export default AdminProductListItem;
