import React, { ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { logger } from '../utils/logger';

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
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fff5f5',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c00',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    fontWeight: '500',
  },
  stackTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'Courier New',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  logsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  logs: {
    fontSize: 9,
    color: '#666',
    fontFamily: 'Courier New',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
});
