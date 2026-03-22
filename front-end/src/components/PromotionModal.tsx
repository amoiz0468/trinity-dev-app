import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Promotion, Product } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';
import AdminService from '../services/adminService';

interface PromotionModalProps {
  visible: boolean;
  promotion: Promotion | null;
  onClose: () => void;
  onSave: (promotionData: Partial<Promotion>) => Promise<void>;
}

const PromotionModal: React.FC<PromotionModalProps> = ({
  visible,
  promotion,
  onClose,
  onSave,
}) => {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [productId, setProductId] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (visible) {
      if (promotion) {
        setTitle(promotion.title);
        setDescription(promotion.description);
        setImageUrl(promotion.imageUrl || '');
        setProductId(promotion.productId || '');
        setDiscountPercentage(promotion.discountPercentage?.toString() || '');
        setStartDate(promotion.startDate.split('T')[0]);
        setEndDate(promotion.endDate.split('T')[0]);
        setIsActive(promotion.isActive);
      } else {
        setTitle('');
        setDescription('');
        setImageUrl('');
        setProductId('');
        setDiscountPercentage('');
        setStartDate(new Date().toISOString().split('T')[0]);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setEndDate(nextWeek.toISOString().split('T')[0]);
        setIsActive(true);
      }
      loadProducts();
    }
  }, [visible, promotion]);

  const loadProducts = async () => {
    try {
      const fetchedProducts = await AdminService.getProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products for promotion:', error);
    }
  };

  const handleSave = async () => {
    if (!title || !description || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        title,
        description,
        imageUrl,
        productId: productId || undefined,
        discountPercentage: discountPercentage ? Number(discountPercentage) : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isActive,
      });
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save promotion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {promotion ? 'Edit Promotion' : 'Add Promotion'}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Summer Sale"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Promotion details..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Banner Image URL</Text>
                <TextInput
                  style={styles.input}
                  value={imageUrl}
                  onChangeText={setImageUrl}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor={theme.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Link to Product (ID)</Text>
                <TextInput
                  style={styles.input}
                  value={productId}
                  onChangeText={setProductId}
                  placeholder="e.g., 5"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
                <Text style={styles.helperText}>Leave blank for general promotion</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Discount Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  value={discountPercentage}
                  onChangeText={setDiscountPercentage}
                  placeholder="e.g., 20"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.sm }]}>
                  <Text style={styles.label}>Start Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                  <Text style={styles.label}>End Date *</Text>
                  <TextInput
                    style={styles.input}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#FFF"
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Promotion'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, isDark: boolean) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      maxHeight: '90%',
    },
    modalContent: {
      padding: SPACING.xl,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: SPACING.xl,
    },
    modalTitle: {
      fontSize: 24,
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      color: theme.text,
    },
    closeButton: {
      padding: SPACING.sm,
    },
    closeButtonText: {
      fontSize: 20,
      color: theme.textMuted,
    },
    form: {
      marginBottom: SPACING.xl,
    },
    inputGroup: {
      marginBottom: SPACING.lg,
    },
    label: {
      fontSize: 14,
      fontFamily: TYPOGRAPHY.fontFamily.bold,
      color: theme.text,
      marginBottom: SPACING.xs,
    },
    input: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 12,
      padding: SPACING.md,
      color: theme.text,
      fontFamily: TYPOGRAPHY.fontFamily.regular,
      borderWidth: 1,
      borderColor: theme.border,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    row: {
      flexDirection: 'row',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: SPACING.sm,
      marginBottom: SPACING.xl,
    },
    helperText: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 4,
    },
    footer: {
      flexDirection: 'row',
      gap: SPACING.md,
      paddingBottom: Platform.OS === 'ios' ? 20 : 0,
    },
    button: {
      flex: 1,
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
    cancelButtonText: {
      color: theme.text,
      fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    saveButton: {
      backgroundColor: theme.primary,
    },
    saveButtonText: {
      color: '#FFF',
      fontFamily: TYPOGRAPHY.fontFamily.bold,
    },
    disabledButton: {
      opacity: 0.5,
    },
  });

export default PromotionModal;
