import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, Linking,
  ScrollView, Image, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { SessionDetailSkeleton } from '../components/Skeleton';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

function getInitials(name) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

function ensureUserId(userId) {
  if (userId == null) return '';
  if (typeof userId === 'string') return userId;
  if (userId._id != null) return String(userId._id);
  return String(userId);
}

export default function SessionDetailScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api('/api/sessions/' + sessionId).catch(() => null),
      api('/api/reminders/sessions/' + sessionId + '/remind').catch(() => null),
    ]).then(([sess, reminder]) => {
      setSession(sess);
      setReminderSet(!!reminder?.exists);
    }).finally(() => setLoading(false));
  }, [sessionId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Socket: listen for session:completed so screen updates in real-time
  useEffect(() => {
    let mounted = true;
    getSocket().then((s) => {
      if (!mounted) return;
      socketRef.current = s;
      s.emit('join:session', sessionId);
      s.on('session:completed', (updatedSession) => {
        if (mounted) setSession(updatedSession);
      });
    });
    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off('session:completed');
        socketRef.current.emit('leave:session', sessionId);
      }
    };
  }, [sessionId]);

  const isParticipant = session?.participants?.some((p) => ensureUserId(p.userId) === user._id);
  const isOrganiser = session?.participants?.some((p) => p.role === 'organiser' && ensureUserId(p.userId) === user._id);
  const canJoin = session?.status === 'active' && !isParticipant && (session?.participants?.length || 0) < session?.maxPlayers;
  const spotsLeft = session ? session.maxPlayers - (session.participants?.length || 0) : 0;

  const openMaps = () => {
    const pitch = session?.pitch;
    if (pitch?.lat != null && pitch?.lng != null) {
      Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + pitch.lat + ',' + pitch.lng).catch(() => {});
    }
  };

  const handleJoin = () => {
    api('/api/sessions/' + sessionId + '/join', { method: 'POST' }).then(setSession).catch((e) => Alert.alert('Error', e.message));
  };

  const handleLeave = () => {
    Alert.alert('Leave session?', 'You can rejoin later if there are spots available.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => api('/api/sessions/' + sessionId + '/leave', { method: 'POST' }).then(setSession).catch((e) => Alert.alert('Error', e.message)) },
    ]);
  };

  const handleCancel = () => {
    Alert.alert('Cancel session?', 'This will remove the session for all participants.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel session', style: 'destructive', onPress: () => api('/api/sessions/' + sessionId, { method: 'DELETE' }).then(() => navigation.goBack()).catch((e) => Alert.alert('Error', e.message)) },
    ]);
  };

  const setReminder = async () => {
    const d = new Date(session.date);
    const [h, m] = (session.time || '18:00').split(':').map(Number);
    d.setHours(h || 18, m || 0, 0, 0);
    d.setHours(d.getHours() - 1);
    try {
      await api('/api/reminders/sessions/' + sessionId + '/remind', { method: 'POST', body: JSON.stringify({ remindAt: d.toISOString() }) });
      setReminderSet(true);
      Alert.alert('Reminder set', 'We\'ll notify you 1 hour before kick-off.');
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const handleComplete = () => {
    Alert.alert('End session?', 'Voting will be opened for participants to vote on Man of the Match.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'End session', style: 'default', onPress: () => {
        setCompletingSession(true);
        api('/api/sessions/' + sessionId + '/complete', { method: 'POST' })
          .then(setSession)
          .catch((e) => Alert.alert('Error', e.message))
          .finally(() => setCompletingSession(false));
      } },
    ]);
  };

  if (loading || !session) {
    return <ScrollView style={styles.container}><SessionDetailSkeleton /></ScrollView>;
  }

  const participants = session.participants || [];
  const previewPlayers = participants.slice(0, 5);

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadgeRow}>
              {session.isBeginnerFriendly && (
                <View style={styles.tag}><Text style={styles.tagText}>Beginner friendly</Text></View>
              )}
              {session.hasReferee && (
                <View style={[styles.tag, styles.tagOrange]}>
                  <Ionicons name="football-outline" size={11} color={colors.accent} />
                  <Text style={[styles.tagText, styles.tagTextOrange]}>Referee</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.heroTitle}>{session.pitch?.name}</Text>
          <View style={styles.heroMetaRow}>
            <Ionicons name="calendar" size={15} color={colors.textMuted} />
            <Text style={styles.heroMeta}>
              {new Date(session.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} · {session.time}
            </Text>
          </View>
          <TouchableOpacity onPress={openMaps} style={styles.heroMetaRow} activeOpacity={0.7}>
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text style={styles.heroMetaLink}>{session.pitch?.address}</Text>
            <Ionicons name="open-outline" size={13} color={colors.primary} style={{ marginLeft: 3 }} />
          </TouchableOpacity>
          {session.rules ? (
            <View style={styles.rulesBox}>
              <Ionicons name="clipboard-outline" size={14} color={colors.textMuted} />
              <Text style={styles.rulesText}>{session.rules}</Text>
            </View>
          ) : null}
        </View>

        {/* Players card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Players</Text>
            <View style={[styles.spotsBadge, spotsLeft === 0 && styles.spotsBadgeFull]}>
              <Text style={[styles.spotsText, spotsLeft === 0 && styles.spotsTextFull]}>
                {participants.length}/{session.maxPlayers} · {spotsLeft > 0 ? spotsLeft + ' spot' + (spotsLeft === 1 ? '' : 's') : 'Full'}
              </Text>
            </View>
          </View>
          <View style={styles.avatarList}>
            {previewPlayers.map((p) => {
              const pid = ensureUserId(p.userId);
              const pName = p.userId?.name || 'Unknown';
              const pAvatar = p.userId?.avatar || null;
              return (
                <View key={pid} style={styles.avatarItem}>
                  {pAvatar ? (
                    <Image source={{ uri: pAvatar }} style={styles.playerAvatar} />
                  ) : (
                    <View style={styles.playerAvatarPlaceholder}>
                      <Text style={styles.playerAvatarText}>{getInitials(pName)}</Text>
                    </View>
                  )}
                  <Text style={styles.playerName} numberOfLines={1}>{pName.split(' ')[0]}</Text>
                </View>
              );
            })}
            {participants.length > 5 && (
              <View style={styles.avatarItem}>
                <View style={styles.moreAvatarCircle}>
                  <Text style={styles.moreAvatarText}>+{participants.length - 5}</Text>
                </View>
              </View>
            )}
          </View>
          {participants.length > 0 && (
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => setPlayersModalVisible(true)} activeOpacity={0.7}>
              <Text style={styles.viewAllBtnText}>View all players</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Session actions */}
        {(canJoin || isParticipant || isOrganiser) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Session</Text>
            <View style={styles.actionList}>
              {canJoin && <ActionItem icon="person-add" label="Join session" onPress={handleJoin} />}
              {isParticipant && <ActionItem icon="person-remove" label="Leave session" onPress={handleLeave} divider />}
              {isOrganiser && session.status === 'active' && <ActionItem icon="checkmark-done" label="End session" onPress={handleComplete} disabled={completingSession} divider />}
              {isOrganiser && <ActionItem icon="trash" label="Cancel session" onPress={handleCancel} danger />}
            </View>
          </View>
        )}

        {/* Participant tools */}
        {isParticipant && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tools</Text>
            <View style={styles.toolGrid}>
              <ToolButton icon="chatbubbles" label="Group chat" color={colors.primary} onPress={() => navigation.navigate('GroupChat', { sessionId })} />
              <ToolButton
                icon="trophy"
                label="Vote MOTM"
                color={session.status === 'completed' ? colors.accent : colors.textMuted}
                onPress={() => session.status === 'completed' && navigation.navigate('MotmVote', { sessionId })}
                disabled={session.status !== 'completed'}
              />
              {session.status === 'active' && (
                <ToolButton
                  icon={reminderSet ? 'notifications' : 'notifications-outline'}
                  label="Reminder"
                  color={reminderSet ? colors.textMuted : colors.primary}
                  onPress={setReminder}
                  disabled={reminderSet}
                  hint={reminderSet ? 'Already set' : null}
                />
              )}
              <ToolButton icon="flag" label="Report" color={colors.textMuted} onPress={() => navigation.navigate('Report', { sessionId })} />
            </View>
          </View>
        )}

        {!isParticipant && (
          <View style={styles.card}>
            <ActionItem icon="flag" label="Report session" onPress={() => navigation.navigate('Report', { sessionId })} />
          </View>
        )}
      </ScrollView>

      {/* Players modal */}
      <Modal visible={playersModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Players ({participants.length})</Text>
              <TouchableOpacity onPress={() => setPlayersModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {participants.map((p) => {
                const pid = ensureUserId(p.userId);
                const pName = p.userId?.name || 'Unknown';
                const pAvatar = p.userId?.avatar || null;
                const isMe = String(pid) === String(user._id);
                return (
                  <TouchableOpacity
                    key={pid}
                    style={styles.modalRow}
                    onPress={() => {
                      if (!isMe) {
                        setPlayersModalVisible(false);
                        navigation.navigate('UserProfile', { userId: String(pid), userName: pName, userAvatar: pAvatar });
                      }
                    }}
                    activeOpacity={isMe ? 1 : 0.75}
                    disabled={isMe}
                  >
                    {pAvatar ? (
                      <Image source={{ uri: pAvatar }} style={styles.modalAvatar} />
                    ) : (
                      <View style={styles.modalAvatarPlaceholder}>
                        <Text style={styles.modalAvatarText}>{getInitials(pName)}</Text>
                      </View>
                    )}
                    <View style={styles.modalPlayerInfo}>
                      <Text style={[styles.modalPlayerName, isMe && styles.modalPlayerNameMe]}>{pName}</Text>
                      {p.role === 'organiser' && <Text style={styles.modalPlayerRole}>Organiser</Text>}
                    </View>
                    {!isMe && <Ionicons name="chevron-forward" size={18} color={colors.border} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function ActionItem({ icon, label, onPress, danger, divider, disabled }) {
  return (
    <>
      <TouchableOpacity style={[styles.actionItem, disabled && styles.actionItemDisabled]} onPress={onPress} activeOpacity={0.7} disabled={disabled}>
        <View style={[styles.actionIcon, danger && styles.actionIconDanger, disabled && styles.actionIconDisabled]}>
          <Ionicons name={icon} size={18} color={colors.textOnPrimary} />
        </View>
        <Text style={[styles.actionLabel, danger && styles.actionLabelDanger, disabled && styles.actionLabelDisabled]}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color={disabled ? colors.border : colors.border} />
      </TouchableOpacity>
      {divider && <View style={styles.itemDivider} />}
    </>
  );
}

function ToolButton({ icon, label, color, onPress, disabled, hint }) {
  return (
    <TouchableOpacity style={[styles.toolBtn, disabled && styles.toolBtnDisabled]} onPress={onPress} activeOpacity={disabled ? 1 : 0.8} disabled={disabled}>
      <View style={[styles.toolIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.toolLabel, disabled && styles.toolLabelDisabled]}>{label}</Text>
      {hint ? <Text style={styles.toolLabelHint}>{hint}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  heroCard: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.sm },
  heroTop: { marginBottom: spacing.sm },
  heroBadgeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  tagOrange: { backgroundColor: '#FFF3E0' },
  tagText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  tagTextOrange: { color: colors.accent },
  heroTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md, marginTop: spacing.xs },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  heroMeta: { ...typography.bodySmall, color: colors.textSecondary },
  heroMetaLink: { ...typography.bodySmall, color: colors.primary, flex: 1 },
  rulesBox: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md },
  rulesText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1 },

  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg, ...shadows.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  cardTitle: { ...typography.label, color: colors.text, marginBottom: spacing.md },
  spotsBadge: { backgroundColor: colors.successLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.sm },
  spotsBadgeFull: { backgroundColor: colors.dangerLight },
  spotsText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  spotsTextFull: { color: colors.danger },

  avatarList: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap', marginBottom: spacing.md },
  avatarItem: { alignItems: 'center', width: 52 },
  playerAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.borderLight },
  playerAvatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { ...typography.caption, fontWeight: '700', color: colors.textOnPrimary },
  playerName: { ...typography.caption, color: colors.textSecondary, marginTop: 3, textAlign: 'center' },
  moreAvatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  moreAvatarText: { ...typography.caption, fontWeight: '700', color: colors.textSecondary },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  viewAllBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600', flex: 1 },

  actionList: { gap: 0 },
  actionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  actionItemDisabled: { opacity: 0.5 },
  actionIcon: { width: 38, height: 38, borderRadius: borderRadius.md, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  actionIconDanger: { backgroundColor: colors.danger },
  actionIconDisabled: { backgroundColor: colors.textMuted },
  actionLabel: { ...typography.body, color: colors.text, flex: 1 },
  actionLabelDanger: { color: colors.danger },
  actionLabelDisabled: { color: colors.textMuted },
  itemDivider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 54 },

  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  toolBtn: { width: '47%', alignItems: 'center', paddingVertical: spacing.lg, backgroundColor: colors.background, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.borderLight },
  toolBtnDisabled: { opacity: 0.5 },
  toolIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  toolLabel: { ...typography.bodySmall, color: colors.text, fontWeight: '600' },
  toolLabelDisabled: { color: colors.textMuted },
  toolLabelHint: { ...typography.caption, color: colors.textMuted, marginTop: 2, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingBottom: spacing.xxl },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { ...typography.h3, color: colors.text },
  modalCloseBtn: { padding: spacing.sm },
  modalScroll: { paddingHorizontal: spacing.lg },
  modalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalAvatar: { width: 46, height: 46, borderRadius: 23, marginRight: spacing.md },
  modalAvatarPlaceholder: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  modalAvatarText: { ...typography.caption, fontWeight: '700', color: colors.textOnPrimary },
  modalPlayerInfo: { flex: 1 },
  modalPlayerName: { ...typography.body, color: colors.text },
  modalPlayerNameMe: { color: colors.textMuted },
  modalPlayerRole: { ...typography.caption, color: colors.primary, fontWeight: '600', marginTop: 1 },
});
