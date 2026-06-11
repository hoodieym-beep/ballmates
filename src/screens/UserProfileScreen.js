import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { UserProfileSkeleton } from '../components/Skeleton';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

function getInitials(name) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function UserProfileScreen({ route, navigation }) {
  const { userId: rawUserId, userName: paramName, userAvatar: paramAvatar } = route.params || {};
  const userId = rawUserId != null ? (typeof rawUserId === 'string' ? rawUserId : String(rawUserId?._id ?? rawUserId)) : null;
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    api('/api/users/' + encodeURIComponent(userId))
      .then(setProfile)
      .catch((e) => { setProfile(null); Alert.alert('Error', e?.message || 'Could not load profile'); })
      .finally(() => setLoading(false));
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading && !profile) {
    return <ScrollView style={styles.container}><UserProfileSkeleton /></ScrollView>;
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-outline" size={52} color={colors.border} />
        <Text style={styles.errorTitle}>Profile not found</Text>
        <Text style={styles.errorSub}>This player may have removed their account.</Text>
      </View>
    );
  }

  const isMe = currentUser && profile._id === currentUser._id;
  const displayName = profile.name || paramName || 'Unknown';
  const levelColor = profile.experienceLevel === 'advanced' ? colors.accent : profile.experienceLevel === 'beginner' ? colors.success : colors.primary;

  const handleMessage = () => {
    if (!profile || !currentUser || isMe) return;
    navigation.navigate('MessagesTab', {
      screen: 'PrivateChat',
      params: { otherUserId: profile._id, otherName: profile.name || paramName || 'Player', otherAvatar: profile.avatar || paramAvatar || null },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Avatar + name hero */}
      <View style={styles.heroCard}>
        {profile.avatar ? (
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
          </View>
        )}
        <Text style={styles.name}>{displayName}</Text>
        {profile.experienceLevel && (
          <View style={[styles.levelBadge, { backgroundColor: levelColor + '22' }]}>
            <Text style={[styles.levelText, { color: levelColor }]}>
              {profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)}
            </Text>
          </View>
        )}
        {!isMe && (
          <Button title="Send message" icon="chatbubble-outline" onPress={handleMessage} style={styles.msgBtn} />
        )}
      </View>

      {/* About */}
      {(profile.bio || profile.preferredPosition) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>About</Text>
          {profile.bio ? (
            <Text style={styles.bioText}>{profile.bio}</Text>
          ) : null}
          {profile.preferredPosition ? (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Ionicons name="football-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.infoText}>{profile.preferredPosition}</Text>
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.xl },
  errorTitle: { ...typography.h3, color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  errorSub: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.primary, marginBottom: spacing.md },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  avatarInitials: { ...typography.h1, color: colors.textOnPrimary },
  name: { ...typography.h2, color: colors.text, marginBottom: spacing.sm },
  levelBadge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: borderRadius.full, marginBottom: spacing.lg },
  levelText: { ...typography.caption, fontWeight: '700', textTransform: 'capitalize' },
  msgBtn: { width: '100%', borderRadius: borderRadius.xl },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.sm },
  cardTitle: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', fontSize: 12, letterSpacing: 0.5, marginBottom: spacing.md },
  bioText: { ...typography.body, color: colors.text, lineHeight: 24, marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIconWrap: { width: 34, height: 34, borderRadius: borderRadius.md, backgroundColor: colors.successLight, justifyContent: 'center', alignItems: 'center' },
  infoText: { ...typography.body, color: colors.text },
});
