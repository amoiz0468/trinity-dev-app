import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Promotion } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';
import { formatCurrency } from '../utils/format';

interface AdminPromotionListItemProps {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotionId: string) => void;
}

const AdminPromotionListItem: React.FC<AdminPromotionListItemProps> = ({
  promotion,
  onEdit,
  onDelete,
}) => {
  const { theme, isDark } = useTheme();
  const styles = createStyles(theme, isDark);

  const isExpired = new Date(promotion.endDate) < new Date();

  return (
    <View style={styles.container}>
      {promotion.imageUrl && (
        <Image source={{ uri: promotion.imageUrl }} style={styles.image} />
      )}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{promotion.title}</Text>
          <View style={[styles.statusBadge, !promotion.isActive || isExpired ? styles.inactiveBadge : styles.activeBadge]}>
            <Text style={styles.statusText}>
              {!promotion.isActive ? 'Inactive' : isExpired ? 'Expired' : 'Active'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.description} numberOfLines={2}>{promotion.description}</Text>
        
        <View style={styles.meta}>
          {promotion.discountPercentage && (
            <Text style={styles.discount}>-{promotion.discountPercentage}% OFF</Text>
          )}
          <Text style={styles.dates}>
            {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={() => onEdit(promotion)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => onDelete(promotion.id)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.border,
    flexDirection: 'row',
  },
  image: {
    width: 100,
    height: '100%',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.text,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 10,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.success,
  },
  description: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  discount: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.accent,
  },
  dates: {
    fontSize: 11,
    color: theme.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: theme.border,
  },
  editButtonText: {
    fontSize: 12,
    color: theme.text,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonText: {
    fontSize: 12,
    color: theme.error,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

export default AdminPromotionListItem;
