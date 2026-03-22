// jest.setup.js
jest.mock('expo-constants', () => ({
  expoConfig: {
    hostUri: '192.168.1.1:8081',
  },
}), { virtual: true });

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: jest.fn().mockImplementation(({ children }) => children),
    SafeAreaConsumer: jest.fn().mockImplementation(({ children }) => children(inset)),
    useSafeAreaInsets: jest.fn().mockReturnValue(inset),
  };
});

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock ThemeContext/useTheme globally for component tests
jest.mock('./src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#F43F5E',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      background: '#0F172A',
      surface: '#1E293B',
      surfaceLight: '#334155',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      border: 'rgba(255, 255, 255, 0.1)',
      disabled: '#1E293B',
      placeholder: '#64748B',
    },
    isDark: true,
    themeName: 'dark',
    toggleTheme: jest.fn(),
    setTheme: jest.fn(),
  }),
}));
