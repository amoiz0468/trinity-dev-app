import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Button from '../components/Button';
import Input from '../components/Input';
import AuthService from '../services/authService';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout, refreshUser } = useAuth();
  const { clearCart } = useCart();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              await clearCart();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert('Error', 'First name and last name are required.');
      return;
    }

    setIsSaving(true);
    try {
      await AuthService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });
      await refreshUser(); // Update global context
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const ProfileItem: React.FC<{
    icon: string;
    label: string;
    value: string;
    onPress?: () => void;
  }> = ({ icon, label, value, onPress }) => (
    <TouchableOpacity
      style={styles.profileItem}
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={`${label}: ${value}`}
      accessibilityRole={onPress ? "button" : "none"}
      accessibilityHint={onPress ? `Double tap to edit ${label}` : undefined}
    >
      <View style={styles.profileItemLeft}>
        <Text style={styles.profileIcon}>{icon}</Text>
        <View style={styles.profileItemContent}>
          <Text style={styles.profileLabel}>{label}</Text>
          <Text style={styles.profileValue}>{value}</Text>
        </View>
      </View>
      {onPress && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );

  const MenuSection: React.FC<{
    icon: string;
    title: string;
    onPress: () => void;
  }> = ({ icon, title, onPress }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      accessibilityLabel={title}
      accessibilityRole="button"
    >
      <View style={styles.menuItemLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/trinity_logo.png')}
          style={styles.logo}
        />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setIsEditing(false)} disabled={isSaving}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 15 }} />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => {
              setFormData({
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                phone: user?.phone || '',
              });
              setIsEditing(true);
            }}>
              <Text style={styles.editText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.card}>
          {isEditing ? (
            <View style={styles.editFormContainer}>
              <Input
                label="First Name"
                value={formData.firstName}
                onChangeText={(txt) => setFormData(p => ({ ...p, firstName: txt }))}
                style={styles.editInputText}
                containerStyle={styles.editInput}
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChangeText={(txt) => setFormData(p => ({ ...p, lastName: txt }))}
                style={styles.editInputText}
                containerStyle={styles.editInput}
              />
              <ProfileItem icon="📧" label="Email (Cannot be changed here)" value={user?.email || ''} />
              <Input
                label="Phone Number"
                value={formData.phone}
                onChangeText={(txt) => setFormData(p => ({ ...p, phone: txt }))}
                keyboardType="phone-pad"
                style={styles.editInputText}
                containerStyle={styles.editInput}
              />
            </View>
          ) : (
            <>
              <ProfileItem
                icon="👤"
                label="Full Name"
                value={`${user?.firstName} ${user?.lastName}`}
              />
              <ProfileItem icon="📧" label="Email" value={user?.email || ''} />
              {user?.phone && (
                <ProfileItem icon="📱" label="Phone" value={user.phone} />
              )}
              <ProfileItem
                icon="🗓️"
                label="Member Since"
                value={new Date(user?.createdAt || '').toLocaleDateString()}
              />
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <MenuSection
            icon="❓"
            title="Help & Support"
            onPress={() => Alert.alert('Help', 'Contact support@trinity.com')}
          />
          <MenuSection
            icon="ℹ️"
            title="About"
            onPress={() => Alert.alert('Trinity Grocery', 'Version 1.0.0')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          fullWidth
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Trinity Grocery © 2026</Text>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.xl,
    paddingTop: 60,
    backgroundColor: COLORS.background,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  avatarText: {
    fontSize: 40,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: COLORS.primary,
  },
  name: {
    fontSize: 28,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingRight: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.black,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 4,
  },
  editText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  saveText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.success,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 15,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  editFormContainer: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  editInput: {
    marginBottom: SPACING.md,
  },
  editInputText: {
    fontSize: 15,
    fontWeight: '600',
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileIcon: {
    fontSize: 22,
    marginRight: SPACING.md,
  },
  profileItemContent: {
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 22,
    marginRight: SPACING.md,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 20,
    color: COLORS.textSecondary,
    fontWeight: '300',
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});

export default ProfileScreen;
