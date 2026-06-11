import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { MotmSkeleton } from '../components/Skeleton';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

function getInitials(name) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function MotmVoteScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [results, setResults] = useState({ votes: {}, list: [], votingOpen: false });
  const [submittingVoteFor, setSubmittingVoteFor] = useState(null);
  const { user } = useAuth();
  const socketRef = useRef(null);

  const load = useCallback(() => {
    api('/api/sessions/' + sessionId).then(setSession).catch(() => setSession(null));
    api('/api/sessions/' + sessionId + '/motm').then(setResults).catch(() => setResults({ votes: {}, list: [], votingOpen: false }));
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Socket: real-time vote updates
  useEffect(() => {
    let mounted = true;
    getSocket().then((s) => {
      if (!mounted) return;
      socketRef.current = s;
      s.emit('join:session', sessionId);
      s.on('motm:updated', (data) => {
        if (mounted) setResults(data);
      });
    });
    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.off('motm:updated');
        socketRef.current.emit('leave:session', sessionId);
      }
    };
  }, [sessionId]);

  if (!session) return <ScrollView style={styles.container}><MotmSkeleton /></ScrollView>;

  const vote = async (nominatedUserId) => {
    if (!results.votingOpen || submittingVoteFor) return;
    setSubmittingVoteFor(nominatedUserId);
    try {
      await api('/api/sessions/' + sessionId + '/motm', { method: 'POST', body: JSON.stringify({ nominatedUserId }) });
      // No need to call load() — socket event will update results
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not submit vote');
    } finally {
      setSubmittingVoteFor(null);
    }
  };

  const votingOpen = results.votingOpen === true;
  const currentVote = results.list?.find((v) => String(v.voterId) === String(user._id));
  const alreadyVoted = !!currentVote;
  const canVote = votingOpen;

  const participants = session?.participants || [];

  const participantUserMap = new Map(
    (session?.participants || []).map((p) => {
      const id = String(p.userId?._id ?? p.userId);
      return [id, p.userId];
    })
  );

  const getVoterFromVote = (vote) => {
    const voterId = String(vote.voterId?._id ?? vote.voterId);
    const voterUser = participantUserMap.get(voterId);
    if (!voterUser) return null;
    return {
      _id: voterId,
      name: voterUser.name || 'Player',
      avatar: voterUser.avatar || null,
    };
  };

  // Sort by vote count desc
  const sortedParticipants = [...participants].sort((a, b) => {
    const aId = String(a.userId?._id ?? a.userId);
    const bId = String(b.userId?._id ?? b.userId);
    return ((results.votes[bId] || 0) - (results.votes[aId] || 0));
  });

  const maxVotes = Math.max(...Object.values(results.votes || {}), 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.trophyCircle}>
          <Ionicons name="trophy" size={36} color={colors.accent} />
        </View>
        <Text style={styles.headerTitle}>Man of the Match</Text>
        <Text style={styles.headerSubtitle}>Vote for the best performer in this session.</Text>
        <View style={styles.statusStack}>
          {!votingOpen && (
            <View style={styles.statusBadge}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={styles.statusText}>Voting opens when the session ends</Text>
            </View>
          )}
          {votingOpen && alreadyVoted && (
            <View style={[styles.statusBadge, styles.statusBadgeDone]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.statusText, styles.statusTextDone]}>Your vote is saved (tap another player to change it)</Text>
            </View>
          )}
          {canVote && (
            <View style={[styles.statusBadge, styles.statusBadgeActive]}>
              <Ionicons name="finger-print" size={14} color={colors.primary} />
              <Text style={[styles.statusText, styles.statusTextActive]}>Tap a player to vote or change your vote</Text>
            </View>
          )}
        </View>
      </View>

      {participants.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No participants found in this session.</Text>
        </View>
      ) : (
        sortedParticipants.map((p) => {
          const uid = String(p.userId?._id ?? p.userId);
          const pName = p.userId?.name || 'Unknown';
          const pAvatar = p.userId?.avatar || null;
          const voteCount = results.votes?.[uid] || 0;
          const barWidth = maxVotes > 0 ? (voteCount / maxVotes) : 0;
          const isMyVote = String(currentVote?.nominatedUserId?._id ?? currentVote?.nominatedUserId ?? '') === uid;
          const isSelf = uid === String(user._id);
          const rowDisabled = !canVote || isSelf || !!submittingVoteFor;
          const votersForParticipant = (results.list || [])
            .filter((v) => String(v.nominatedUserId?._id ?? v.nominatedUserId) === uid)
            .map(getVoterFromVote)
            .filter(Boolean);

          return (
            <TouchableOpacity
              key={uid}
              style={[
                styles.playerCard,
                rowDisabled && styles.playerCardDisabled,
                isMyVote && styles.playerCardSelected,
                isSelf && styles.playerCardSelf,
              ]}
              onPress={() => !rowDisabled && vote(uid)}
              activeOpacity={rowDisabled ? 1 : 0.82}
              disabled={rowDisabled}
            >
              <View style={styles.playerLeft}>
                {pAvatar ? (
                  <Image source={{ uri: pAvatar }} style={styles.playerAvatar} />
                ) : (
                  <View style={styles.playerAvatarPlaceholder}>
                    <Text style={styles.playerAvatarText}>{getInitials(pName)}</Text>
                  </View>
                )}
                <View style={styles.playerInfo}>
                  <View style={styles.playerNameRow}>
                    <Text style={styles.playerName}>{pName}</Text>
                    {isSelf && <Text style={styles.selfTag}>You (voting disabled)</Text>}
                  </View>
                  {voteCount > 0 && (
                    <View style={styles.barWrap}>
                      <View style={[styles.bar, { width: `${barWidth * 100}%` }]} />
                    </View>
                  )}
                  <View style={styles.votersInlineList}>
                    {votersForParticipant.length === 0 ? (
                      <Text style={styles.votersInlineEmpty}>No votes yet</Text>
                    ) : (
                      votersForParticipant.map((voter) => (
                        <View key={voter._id} style={styles.voterChip}>
                          {voter.avatar ? (
                            <Image source={{ uri: voter.avatar }} style={styles.voterAvatar} />
                          ) : (
                            <View style={styles.voterAvatarFallback}>
                              <Text style={styles.voterAvatarText}>{getInitials(voter.name)}</Text>
                            </View>
                          )}
                          <Text style={styles.voterName} numberOfLines={1}>{voter.name}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
              <View style={styles.playerRight}>
                <Text style={styles.voteCount}>{voteCount}</Text>
                <Text style={styles.voteLabel}>{voteCount === 1 ? 'vote' : 'votes'}</Text>
                {submittingVoteFor === uid ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 4 }} />
                ) : isMyVote ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} style={{ marginTop: 4 }} />
                ) : (
                  !rowDisabled && <Ionicons name="chevron-forward" size={18} color={colors.border} style={{ marginTop: 4 }} />
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  trophyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statusStack: { width: '100%', gap: spacing.sm },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusBadgeDone: { backgroundColor: colors.successLight },
  statusBadgeActive: { backgroundColor: colors.successLight },
  statusText: { ...typography.bodySmall, color: colors.textMuted },
  statusTextDone: { color: colors.success, fontWeight: '600' },
  statusTextActive: { color: colors.primary, fontWeight: '600' },
  votersInlineList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  votersInlineEmpty: { ...typography.caption, color: colors.textMuted },
  voterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.full,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: spacing.xs,
  },
  voterAvatar: { width: 20, height: 20, borderRadius: 10, marginRight: 4 },
  voterAvatarFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 4,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voterAvatarText: { fontSize: 9, fontWeight: '700', color: colors.textOnPrimary },
  voterName: { ...typography.caption, color: colors.textSecondary },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  playerCardSelected: {
    borderWidth: 1.5,
    borderColor: colors.success,
  },
  playerCardSelf: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerCardDisabled: { opacity: 0.75 },
  playerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.md },
  playerAvatar: { width: 48, height: 48, borderRadius: 24 },
  playerAvatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  playerAvatarText: { ...typography.body, fontWeight: '700', color: colors.textOnPrimary },
  playerInfo: { flex: 1 },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 6,
  },
  playerName: { ...typography.body, fontWeight: '600', color: colors.text, flexShrink: 1 },
  selfTag: { ...typography.caption, color: colors.textMuted },
  barWrap: { height: 5, backgroundColor: colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  bar: { height: 5, backgroundColor: colors.accent, borderRadius: 3 },
  playerRight: { alignItems: 'center', minWidth: 52 },
  voteCount: { ...typography.h3, color: colors.primary },
  voteLabel: { ...typography.caption, color: colors.textMuted },
  emptyWrap: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted },
});
