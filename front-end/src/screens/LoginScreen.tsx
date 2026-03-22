import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { SPACING, TYPOGRAPHY, ERROR_MESSAGES } from '../constants';
import { validateEmail } from '../utils/validation';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { login } = useAuth();
  const { theme, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    const identifier = email.trim();

    if (!identifier) {
      newErrors.email = 'Email or username is required';
    } else if (identifier.includes('@') && !validateEmail(identifier)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const identifier = email.trim();
      const normalizedIdentifier = identifier.includes('@')
        ? identifier.toLowerCase()
        : identifier;
      await login({ email: normalizedIdentifier, password });
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || ERROR_MESSAGES.INVALID_CREDENTIALS);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View 
            style={styles.logoContainer}
            accessibilityRole="image"
            accessibilityLabel="Trinity Logo"
          >
            <Image
              source={require('../../assets/trinity_logo.png')}
              style={styles.logo}
            />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Elevate your grocery experience</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email or Username"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com or admin"
            keyboardType="default"
            autoCapitalize="none"
            autoComplete="username"
            error={errors.email}
            icon={<Text style={styles.inputIcon}>📧</Text>}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            error={errors.password}
            icon={<Text style={styles.inputIcon}>🔒</Text>}
            rightIcon={
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <TouchableOpacity 
            style={styles.forgotPassword}
            accessibilityLabel="Forgot Password?"
            accessibilityRole="link"
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="large"
            style={styles.loginButton}
          />

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>New to Trinity? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.2)',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.3 : 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  logo: {
    width: 65,
    height: 65,
    borderRadius: 14,
  },
  title: {
    fontSize: 34,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: theme.text,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  form: {
    width: '100%',
  },
  inputIcon: {
    fontSize: 18,
  },
  eyeIcon: {
    fontSize: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  loginButton: {
    marginTop: SPACING.md,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xl,
  },
  signupText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  signupLink: {
    fontSize: 15,
    color: theme.primary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

export default LoginScreen;
