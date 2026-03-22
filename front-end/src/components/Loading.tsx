import React, { useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';

interface LoadingProps {
  message?: string;
  size?: 'small' | 'large';
}

const Loading: React.FC<LoadingProps> = ({ message, size = 'large' }) => {
  const { theme, isDark } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View 
      style={styles.container}
      accessibilityLabel={message || "Loading"}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      <ActivityIndicator size={size} color={theme.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: theme.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
});

export default Loading;
