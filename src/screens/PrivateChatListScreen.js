import React, { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { ChatListSkeleton } from '../components/Skeleton';
import { colors, spacing, typography } from '../constants/theme';

function formatLatestTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function PrivateChatListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api('/api/messages/private')
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Real-time: refresh list when a new private message arrives
  useEffect(() => {
    let mounted = true;
    getSocket().then((s) => {
      if (!mounted) return;
      s.off('private:message:list');
      s.on('private:message:list', () => { if (mounted) load(); });
    });
    return () => {
      mounted = false;
      getSocket().then((s) => s.off('private:message:list'));
    };
  }, [load]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('NewChat')}
          style={{ marginRight: spacing.sm, padding: spacing.sm }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  if (loading) return <View style={styles.container}><ChatListSkeleton /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('PrivateChat', {
              otherUserId: item._id,
              otherName: item.name,
              otherAvatar: item.avatar ?? null,
            })}
          >
            <View style={styles.row}>
              <View style={styles.avatarWrap}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.content}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {item.latestMessageAt ? (
                    <Text style={styles.time}>{formatLatestTime(item.latestMessageAt)}</Text>
                  ) : null}
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.latestMessage?.trim() || 'No messages yet'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.borderLight} />
            </View>
            <View style={styles.divider} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbubbles-outline" size={52} color={colors.border} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>Tap the compose icon above to message a fellow player.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingTop: spacing.sm, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 80 },
  avatarWrap: { marginRight: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: { fontSize: 18, fontWeight: '700', color: colors.textOnPrimary },
  content: { flex: 1, minWidth: 0, marginRight: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  name: { ...typography.body, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.sm },
  time: { ...typography.caption, color: colors.textMuted, fontSize: 12 },
  preview: { ...typography.bodySmall, color: colors.textSecondary },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xxl },
  emptyTitle: { ...typography.h3, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptySub: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
