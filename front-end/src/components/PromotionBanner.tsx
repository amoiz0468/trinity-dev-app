import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { Promotion } from '../types';
import { SPACING, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { formatDate } from '../utils/format';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - SPACING.lg * 2;

interface PromotionBannerProps {
  promotion: Promotion;
  onPress?: (promotion: Promotion) => void;
}

const PromotionBanner: React.FC<PromotionBannerProps> = ({ promotion, onPress }) => {
  const { theme, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(promotion)}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: promotion.imageUrl }}
        style={styles.background}
        imageStyle={styles.imageStyle}
      >
        <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }]}>
          <View style={styles.content}>
            {promotion.discountPercentage && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>-{promotion.discountPercentage}%</Text>
              </View>
            )}
            <Text style={styles.title} numberOfLines={1}>
              {promotion.title}
            </Text>
            <Text style={styles.description} numberOfLines={2}>
              {promotion.description}
            </Text>
            {promotion.endDate && (
              <Text style={styles.validUntil}>Valid until {formatDate(promotion.endDate)}</Text>
            )}
            {promotion.productName && (
              <Text style={styles.productLink}>
                On {promotion.productName}
              </Text>
            )}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: BANNER_WIDTH,
    height: 160,
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    padding: SPACING.lg,
    justifyContent: 'flex-end',
  },
  content: {
    maxWidth: '80%',
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.black,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    marginBottom: 4,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  productLink: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  validUntil: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginTop: 6,
  },
});

export default PromotionBanner;
