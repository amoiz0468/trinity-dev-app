import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Product } from '../types';
import { COLORS, SPACING } from '../constants';
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
                        <Text style={styles.stockText}>{product.stock} in stock</Text>
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

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
        alignItems: 'center',
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
    },
    info: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    name: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    brand: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    price: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
        marginRight: SPACING.md,
    },
    stockBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    stockLow: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },
    stockOk: {
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
    },
    stockText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    actionIcon: {
        fontSize: 16,
    },
});

export default AdminProductListItem;
