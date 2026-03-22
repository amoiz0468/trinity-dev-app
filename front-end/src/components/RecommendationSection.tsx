import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Product } from '../types';
import { SPACING, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import ProductCard from './ProductCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = 220;

interface RecommendationSectionProps {
  products: Product[];
  onProductPress: (product: Product) => void;
  title?: string;
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
  products,
  onProductPress,
  title = 'Recommended for You',
}) => {
  const { theme } = useTheme();

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + SPACING.md}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onPress={onProductPress}
            style={styles.card}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    marginLeft: SPACING.lg,
    marginBottom: SPACING.md,
  },
  scrollContent: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.md,
  },
  card: {
    width: CARD_WIDTH,
    marginRight: SPACING.md,
    marginBottom: SPACING.md,
  },
});

export default RecommendationSection;
