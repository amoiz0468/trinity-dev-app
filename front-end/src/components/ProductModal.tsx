import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Product } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';
import Button from './Button';

interface ProductModalProps {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
    onSave: (productData: Partial<Product>) => Promise<void>;
}

const ProductModal: React.FC<ProductModalProps> = ({
    visible,
    product,
    onClose,
    onSave,
}) => {
    const { theme, isDark } = useTheme();
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const [carbohydrates, setCarbohydrates] = useState('');
    const [fat, setFat] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (product) {
            setName(product.name);
            setBrand(product.brand);
            setCategory(product.category);
            setPrice(product.price.toString());
            setStock(product.stock.toString());
            setImageUrl(product.imageUrl);
            setDescription(product.description || '');
            if (product.nutritionalInfo) {
                setCalories(product.nutritionalInfo.calories.toString());
                setProtein(product.nutritionalInfo.protein.toString());
                setCarbohydrates(product.nutritionalInfo.carbohydrates.toString());
                setFat(product.nutritionalInfo.fat.toString());
            } else {
                setCalories('');
                setProtein('');
                setCarbohydrates('');
                setFat('');
            }
        } else {
            setName('');
            setBrand('');
            setCategory('');
            setPrice('');
            setStock('');
            setImageUrl('');
            setDescription('');
            setCalories('');
            setProtein('');
            setCarbohydrates('');
            setFat('');
        }
    }, [product, visible]);

    const handleSave = async () => {
        if (!name || !price || !stock) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Price, Stock)');
            return;
        }

        try {
            setLoading(true);
            await onSave({
                name,
                brand,
                category,
                price: parseFloat(price),
                stock: parseInt(stock, 10),
                imageUrl,
                description,
                nutritionalInfo: {
                    calories: parseFloat(calories) || 0,
                    protein: parseFloat(protein) || 0,
                    carbohydrates: parseFloat(carbohydrates) || 0,
                    fat: parseFloat(fat) || 0,
                    servingSize: '100g'
                }
            });
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to save product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContent}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {product ? 'Edit Product' : 'Add New Product'}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>
 
                    <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Product Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Organic Bananas"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
 
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
                                <Text style={styles.label}>Brand</Text>
                                <TextInput
                                    style={styles.input}
                                    value={brand}
                                    onChangeText={setBrand}
                                    placeholder="e.g. Nature's Pride"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Category</Text>
                                <TextInput
                                    style={styles.input}
                                    value={category}
                                    onChangeText={setCategory}
                                    placeholder="e.g. Produce"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>
 
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
                                <Text style={styles.label}>Price ($) *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={price}
                                    onChangeText={setPrice}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Stock *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={stock}
                                    onChangeText={setStock}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>

                        <Text style={styles.sectionHeader}>Nutritional Info (per 100g)</Text>
                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
                                <Text style={styles.label}>Calories (kcal)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={calories}
                                    onChangeText={setCalories}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Protein (g)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={protein}
                                    onChangeText={setProtein}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
                                <Text style={styles.label}>Carbs (g)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={carbohydrates}
                                    onChangeText={setCarbohydrates}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Fat (g)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fat}
                                    onChangeText={setFat}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>
                        </View>
 
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Image URL</Text>
                            <TextInput
                                style={styles.input}
                                value={imageUrl}
                                onChangeText={setImageUrl}
                                placeholder="https://example.com/image.jpg"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>
 
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                placeholder="Product description..."
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button
                                title={product ? 'Update Product' : 'Add Product'}
                                onPress={handleSave}
                                loading={loading}
                                fullWidth
                                size="large"
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '92%',
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    title: {
        fontSize: 20,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        color: theme.text,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    closeIcon: {
        fontSize: 16,
        color: theme.textSecondary,
    },
    form: {
        padding: SPACING.xl,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        color: theme.textSecondary,
        fontSize: 14,
        marginBottom: 8,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    input: {
        backgroundColor: theme.surface,
        color: theme.text,
        borderRadius: 14,
        padding: Platform.OS === 'ios' ? SPACING.md : SPACING.sm,
        fontSize: 16,
        fontFamily: TYPOGRAPHY.fontFamily.regular,
        borderWidth: 1,
        borderColor: theme.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: SPACING.md,
    },
    row: {
        flexDirection: 'row',
    },
    buttonContainer: {
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    sectionHeader: {
        fontSize: 14,
        fontFamily: TYPOGRAPHY.fontFamily.bold,
        color: theme.text,
        marginTop: SPACING.md,
        marginBottom: SPACING.lg,
        textTransform: 'uppercase',
        letterSpacing: 1,
        opacity: 0.8,
    },
});

export default ProductModal;
