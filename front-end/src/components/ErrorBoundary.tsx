import React, { ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logger } from '../utils/logger';
import { ThemeContext } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../constants';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('Error caught by ErrorBoundary', error);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ThemeContext.Consumer>
          {(context) => {
            if (!context) return null;
            const { theme, isDark } = context;
            const styles = createStyles(theme, isDark);
            return (
              <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView}>
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>⚠️ Application Error</Text>
                    <Text style={styles.errorMessage}>
                      {this.state.error?.message || 'Unknown error occurred'}
                    </Text>

                    {this.state.error?.stack && (
                      <>
                        <Text style={styles.stackTitle}>Stack Trace:</Text>
                        <Text style={styles.stackTrace}>
                          {this.state.error.stack}
                        </Text>
                      </>
                    )}

                    {this.state.errorInfo?.componentStack && (
                      <>
                        <Text style={styles.stackTitle}>Component Stack:</Text>
                        <Text style={styles.stackTrace}>
                          {this.state.errorInfo.componentStack}
                        </Text>
                      </>
                    )}

                    <Text style={styles.logsTitle}>Recent Logs:</Text>
                    <Text style={styles.logs}>{logger.getLogsAsString()}</Text>
                  </View>
                </ScrollView>
              </SafeAreaView>
            );
          }}
        </ThemeContext.Consumer>
      );
    }

    return this.props.children;
  }
}

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    padding: SPACING.lg,
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)',
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.error,
    marginBottom: SPACING.md,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.text,
    marginBottom: SPACING.xl,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  stackTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  stackTrace: {
    fontSize: 11,
    color: theme.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: theme.surface,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: SPACING.md,
  },
  logsTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  logs: {
    fontSize: 10,
    color: theme.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: theme.surface,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
});
