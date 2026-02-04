import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Button from '../components/Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { clearCart } = useCart();

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
              navigation.navigate('Login' as never);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
        },
      ]
    );
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
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
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
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.card}>
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
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <MenuSection
            icon="🔔"
            title="Notifications"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings')}
          />
          <MenuSection
            icon="🔐"
            title="Privacy & Security"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings')}
          />
          <MenuSection
            icon="💳"
            title="Payment Methods"
            onPress={() => Alert.alert('Coming Soon', 'Payment settings')}
          />
          <MenuSection
            icon="📍"
            title="Saved Addresses"
            onPress={() => Alert.alert('Coming Soon', 'Address management')}
          />
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
    backgroundColor: COLORS.surface,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.fontSize.xxxl,
    fontWeight: '700',
    color: COLORS.surface,
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  email: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.textSecondary,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  profileItemContent: {
    flex: 1,
  },
  profileLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  profileValue: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  menuTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  chevron: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.textSecondary,
  },
  footer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
  },
});

export default ProfileScreen;
