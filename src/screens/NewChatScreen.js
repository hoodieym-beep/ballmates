import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { PlayerListSkeleton } from '../components/Skeleton';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

function getInitials(name) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function NewChatScreen({ navigation }) {
  const [players, setPlayers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api('/api/users/me/players')
        .then((data) => setPlayers(Array.isArray(data) ? data : []))
        .catch(() => setPlayers([]))
        .finally(() => setLoading(false));
    }, [])
  );

  const filtered = query.trim()
    ? players.filter((p) => p.name?.toLowerCase().includes(query.trim().toLowerCase()))
    : players;

  const openChat = (player) => {
    navigation.navigate('PrivateChat', {
      otherUserId: player._id,
      otherName: player.name,
      otherAvatar: player.avatar ?? null,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search players…"
          placeholderTextColor={colors.textMuted}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <PlayerListSkeleton />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => openChat(item)}>
              <View style={styles.row}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{getInitials(item.name)}</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.preferredPosition || item.experienceLevel ? (
                    <Text style={styles.sub}>
                      {[item.preferredPosition, item.experienceLevel].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.border} />
              </View>
              <View style={styles.divider} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="people-outline" size={52} color={colors.border} />
              <Text style={styles.emptyTitle}>
                {query.trim() ? 'No players match "' + query.trim() + '"' : 'No players yet'}
              </Text>
              <Text style={styles.emptySub}>
                {query.trim() ? 'Try a different name.' : 'Join a session to meet players you can message.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchIcon: { marginLeft: spacing.xs },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  listContent: { paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 80 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: spacing.md },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: colors.textOnPrimary },
  info: { flex: 1 },
  name: { ...typography.body, fontWeight: '600', color: colors.text },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  emptyWrap: { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xxl },
  emptyTitle: { ...typography.h3, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm, textAlign: 'center' },
  emptySub: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
});
