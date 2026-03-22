import React, { useState, useMemo } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import { SPACING, LAYOUT, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: object;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  accessibilityLabel,
  accessibilityHint,
  ...props
}) => {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, icon ? styles.inputWithIcon : undefined, style]}
          placeholderTextColor={theme.textMuted}
          selectionColor={theme.primary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: theme.text,
    marginBottom: SPACING.sm,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)', // Glassy effect
    borderWidth: 1.5,
    borderColor: theme.border,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    height: 56,
  },
  inputContainerFocused: {
    borderColor: theme.primary,
    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(79, 70, 229, 0.05)', // Subtle primary glow
  },
  inputContainerError: {
    borderColor: theme.error,
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(220, 38, 38, 0.05)',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: TYPOGRAPHY.fontSize.md,
    color: theme.text,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
  },
  inputWithIcon: {
    marginLeft: SPACING.sm,
  },
  iconContainer: {
    marginRight: SPACING.xs,
  },
  rightIconContainer: {
    padding: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: theme.error,
    marginTop: SPACING.xs,
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default Input;
