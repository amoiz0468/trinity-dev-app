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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { SPACING, TYPOGRAPHY } from '../constants';
import { validateEmail, validateName } from '../utils/validation';

type EditProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<EditProfileScreenNavigationProp>();
  const { user, refreshUser } = useAuth();
  const { theme, isDark } = useTheme();
  const { updateProfile } = require('../services/authService').default;

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    zip_code: user?.zip_code || '',
    country: user?.country || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = 'Please enter a valid first name';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Please enter a valid last name';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        zip_code: formData.zip_code.trim(),
        country: formData.country.trim(),
      });
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.form}>
          <Input
            label="First Name"
            value={formData.firstName}
            onChangeText={(value) => updateField('firstName', value)}
            placeholder="Enter your first name"
            autoCapitalize="words"
            error={errors.firstName}
          />

          <Input
            label="Last Name"
            value={formData.lastName}
            onChangeText={(value) => updateField('lastName', value)}
            placeholder="Enter your last name"
            autoCapitalize="words"
            error={errors.lastName}
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label="Phone"
            value={formData.phone}
            onChangeText={(value) => updateField('phone', value)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Address Information</Text>

          <Input
            label="Address"
            value={formData.address}
            onChangeText={(value) => updateField('address', value)}
            placeholder="Enter your address"
            multiline
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: SPACING.md }}>
              <Input
                label="City"
                value={formData.city}
                onChangeText={(value) => updateField('city', value)}
                placeholder="City"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Zip Code"
                value={formData.zip_code}
                onChangeText={(value) => updateField('zip_code', value)}
                placeholder="00000"
              />
            </View>
          </View>

          <Input
            label="Country"
            value={formData.country}
            onChangeText={(value) => updateField('country', value)}
            placeholder="Enter your country"
          />

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="large"
            style={styles.saveButton}
          />

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
            accessibilityLabel="Cancel editing"
            accessibilityRole="button"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
    paddingBottom: 40,
  },
  form: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: theme.textSecondary,
    marginBottom: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: SPACING.xl,
    opacity: isDark ? 0.3 : 0.6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  saveButton: {
    marginTop: SPACING.xl,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButton: {
    marginTop: SPACING.md,
    alignItems: 'center',
    padding: SPACING.md,
  },
  cancelText: {
    fontSize: 15,
    color: theme.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
});

export default EditProfileScreen;
