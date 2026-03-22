import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Notification } from '../types';
import { SPACING, TYPOGRAPHY } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { formatRelativeTime } from '../utils/format';

interface NotificationCenterProps {
  isVisible: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isVisible,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const { theme, isDark } = useTheme();

  const getEmoji = (type: Notification['type']) => {
    switch (type) {
      case 'promotion': return '🏷️';
      case 'alert': return '⚠️';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: theme.surface, borderColor: theme.border },
        !item.isRead && { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }
      ]}
      onPress={() => onMarkAsRead(item.id)}
    >
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
        <Text style={{ fontSize: 24 }}>{getEmoji(item.type)}</Text>
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: theme.text }]}>{item.title}</Text>
          <Text style={[styles.notificationTime, { color: theme.textSecondary }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
        <Text style={[styles.notificationMessage, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={{ fontSize: 28, color: theme.text }}>✕</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
          <TouchableOpacity onPress={onMarkAllAsRead} style={styles.readAllButton}>
            <Text style={[styles.readAllText, { color: theme.primary }]}>Read All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 64 }}>🔕</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notifications yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: TYPOGRAPHY.fontFamily.black,
  },
  readAllButton: {
    padding: 4,
  },
  readAllText: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  listContent: {
    padding: SPACING.lg,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 20,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    marginTop: SPACING.md,
  },
});

export default NotificationCenter;
