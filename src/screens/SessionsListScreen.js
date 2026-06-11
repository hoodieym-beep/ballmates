import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SessionsListSkeleton } from '../components/Skeleton';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { getCurrentLocationWithAddress } from '../utils/location';

function formatSessionDate(dateStr, time) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let label;
  if (d.toDateString() === now.toDateString()) label = 'Today';
  else if (d.toDateString() === tomorrow.toDateString()) label = 'Tomorrow';
  else label = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  return time ? label + ' · ' + time : label;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FILTERS = [
  { key: 'mine', label: 'My Sessions', icon: 'person' },
  { key: 'browse', label: 'Browse', icon: 'search' },
  { key: 'nearme', label: 'Near Me', icon: 'location' },
];

const DISTANCE_OPTIONS = [
  { key: '25',     label: 'Under 25 km',  max: 25 },
  { key: '50',     label: 'Under 50 km',  max: 50 },
  { key: '75',     label: 'Under 75 km',  max: 75 },
  { key: '100',    label: 'Under 100 km', max: 100 },
  { key: 'over100', label: 'Over 100 km', min: 100 },
];

export default function SessionsListScreen({ navigation }) {
  const [allSessions, setAllSessions] = useState({ mine: [], browse: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('mine');
  const [userLocation, setUserLocation] = useState(null);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [distanceFilter, setDistanceFilter] = useState('50');
  const [seatFilter, setSeatFilter] = useState(false);
  const [distanceModalVisible, setDistanceModalVisible] = useState(false);
  const { user } = useAuth();

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    Promise.all([
      api('/api/sessions/mine').catch(() => []),
      api('/api/sessions').catch(() => []),
    ]).then(([mine, browse]) => {
      setAllSessions({
        mine: Array.isArray(mine) ? mine : [],
        browse: Array.isArray(browse) ? browse : [],
      });
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (activeFilter === 'nearme' && !userLocation && !nearMeLoading) {
      setNearMeLoading(true);
      getCurrentLocationWithAddress({ skipUKCheck: true })
        .then((loc) => { if (loc) setUserLocation(loc); })
        .catch(() => {})
        .finally(() => setNearMeLoading(false));
    }
  }, [activeFilter]);

  const nearMeSessions = useMemo(() => {
    if (!userLocation) return [];
    const option = DISTANCE_OPTIONS.find((o) => o.key === distanceFilter);
    return allSessions.browse
      .filter((item) => {
        const lat = Number(item.pitch?.lat);
        const lng = Number(item.pitch?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
        const dist = haversineKm(userLocation.latitude, userLocation.longitude, lat, lng);
        if (option?.min != null) return dist > option.min;
        return dist <= (option?.max ?? 50);
      })
      .filter((item) => {
        if (!seatFilter) return true;
        return (item.maxPlayers - (item.participants?.length || 0)) > 0;
      })
      .sort((a, b) => {
        const dA = haversineKm(userLocation.latitude, userLocation.longitude, Number(a.pitch?.lat), Number(a.pitch?.lng));
        const dB = haversineKm(userLocation.latitude, userLocation.longitude, Number(b.pitch?.lat), Number(b.pitch?.lng));
        return dA - dB;
      });
  }, [allSessions.browse, userLocation, distanceFilter, seatFilter]);

  const sessions = activeFilter === 'nearme' ? nearMeSessions : (allSessions[activeFilter] ?? []);

  const renderItem = ({ item }) => {
    const spotsLeft = item.maxPlayers - ((item.participants && item.participants.length) || 0);
    const isFull = spotsLeft <= 0;
    const isCompleted = item.status === 'completed';
    const isCancelled = item.status === 'cancelled';

    let distLabel = null;
    if (activeFilter === 'nearme' && userLocation) {
      const lat = Number(item.pitch?.lat);
      const lng = Number(item.pitch?.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const dist = haversineKm(userLocation.latitude, userLocation.longitude, lat, lng);
        distLabel = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
      }
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item._id })}
        style={styles.cardTouch}
      >
        <View style={[styles.card, (isCompleted || isCancelled) && styles.cardDimmed]}>
          <View style={[styles.cardAccent, isCompleted && styles.cardAccentEnded, isCancelled && styles.cardAccentCancelled]} />
          <View style={styles.cardBody}>
            <View style={styles.cardTopRow}>
              <Text style={styles.title} numberOfLines={1}>{item.pitch?.name || 'Session'}</Text>
              <View style={styles.badgeGroup}>
                {distLabel && (
                  <View style={styles.distBadge}>
                    <Ionicons name="navigate" size={10} color={colors.primary} />
                    <Text style={styles.distBadgeText}>{distLabel}</Text>
                  </View>
                )}
                {isCompleted ? (
                  <View style={styles.endedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#fff" />
                    <Text style={styles.endedBadgeText}>Ended</Text>
                  </View>
                ) : isCancelled ? (
                  <View style={styles.cancelledBadge}>
                    <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                  </View>
                ) : (
                  <View style={[styles.spotsBadge, isFull && styles.spotsBadgeFull]}>
                    <Text style={[styles.spotsText, isFull && styles.spotsTextFull]}>
                      {isFull ? 'Full' : spotsLeft + ' spot' + (spotsLeft === 1 ? '' : 's')}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText}>{formatSessionDate(item.date, item.time)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>{item.pitch?.address || ''}</Text>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.playersBadge}>
                <Ionicons name="people" size={13} color={colors.primary} />
                <Text style={styles.playersBadgeText}>{(item.participants?.length) || 0}/{item.maxPlayers}</Text>
              </View>
              {item.isBeginnerFriendly && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Beginner friendly</Text>
                </View>
              )}
              {item.hasReferee && (
                <View style={[styles.tag, styles.tagOrange]}>
                  <Ionicons name="football-outline" size={11} color={colors.accent} />
                  <Text style={[styles.tagText, styles.tagTextOrange]}>Referee</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    if (loading) return null;
    return (
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={f.icon}
                size={14}
                color={activeFilter === f.key ? colors.textOnPrimary : colors.textMuted}
              />
              <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
              {f.key === 'mine' && allSessions.mine.length > 0 && (
                <View style={[styles.filterBadge, activeFilter === f.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, activeFilter === f.key && styles.filterBadgeTextActive]}>
                    {allSessions.mine.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeFilter === 'nearme' && (
          <View style={styles.nearMeFilters}>
            {nearMeLoading && (
              <View style={styles.locatingRow}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.locatingText}>Getting your location…</Text>
              </View>
            )}
            <View style={styles.filterPillRow}>
              {/* Distance dropdown */}
              <TouchableOpacity
                style={styles.filterPill}
                onPress={() => setDistanceModalVisible(true)}
                activeOpacity={0.75}
              >
                <Ionicons name="navigate-circle-outline" size={15} color={colors.primary} />
                <Text style={styles.filterPillText} numberOfLines={1}>
                  {DISTANCE_OPTIONS.find((o) => o.key === distanceFilter)?.label ?? 'Distance'}
                </Text>
                <Ionicons name="chevron-down" size={13} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Has a spot toggle */}
              <TouchableOpacity
                style={[styles.filterPill, seatFilter && styles.filterPillActive]}
                onPress={() => setSeatFilter((v) => !v)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={seatFilter ? 'checkmark-circle' : 'people-outline'}
                  size={15}
                  color={seatFilter ? colors.textOnPrimary : colors.textMuted}
                />
                <Text style={[styles.filterPillText, seatFilter && styles.filterPillTextActive]}>
                  Has a spot
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          loading ? (
            <SessionsListSkeleton />
          ) : nearMeLoading ? null : !refreshing ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="football-outline" size={52} color={colors.border} />
              <Text style={styles.emptyTitle}>
                {activeFilter === 'mine'
                  ? 'No sessions yet'
                  : activeFilter === 'nearme'
                  ? 'No sessions nearby'
                  : 'No sessions found'}
              </Text>
              <Text style={styles.emptySub}>
                {activeFilter === 'mine'
                  ? 'Join or create a session to get started.'
                  : activeFilter === 'nearme'
                  ? 'Try a wider distance or check back later.'
                  : 'Check back later for new sessions.'}
              </Text>
            </View>
          ) : null
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateSession')}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>

      {/* Distance picker bottom sheet */}
      <Modal visible={distanceModalVisible} transparent animationType="slide" onRequestClose={() => setDistanceModalVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setDistanceModalVisible(false)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Distance</Text>
            <Text style={styles.sheetSubtitle}>Show sessions within</Text>
            {DISTANCE_OPTIONS.map((opt, i) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.sheetOption, i < DISTANCE_OPTIONS.length - 1 && styles.sheetOptionBorder]}
                onPress={() => { setDistanceFilter(opt.key); setDistanceModalVisible(false); }}
                activeOpacity={0.7}
              >
                <View style={[styles.sheetRadio, distanceFilter === opt.key && styles.sheetRadioActive]}>
                  {distanceFilter === opt.key && <View style={styles.sheetRadioDot} />}
                </View>
                <Text style={[styles.sheetOptionText, distanceFilter === opt.key && styles.sheetOptionTextActive]}>
                  {opt.label}
                </Text>
                {distanceFilter === opt.key && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: spacing.lg, paddingBottom: 100 },

  filterScroll: { flexGrow: 0, marginBottom: spacing.lg },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontWeight: '600',
  },
  filterChipTextActive: { color: colors.textOnPrimary },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  filterBadgeTextActive: { color: colors.textOnPrimary },

  nearMeFilters: { marginBottom: spacing.lg },
  locatingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  locatingText: { ...typography.caption, color: colors.textMuted },

  filterPillRow: { flexDirection: 'row', gap: spacing.sm },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterPillText: {
    ...typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  filterPillTextActive: { color: colors.textOnPrimary },

  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    ...shadows.lg,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  sheetTitle: { ...typography.h3, color: colors.text, marginBottom: 4 },
  sheetSubtitle: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  sheetOptionBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  sheetRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetRadioActive: { borderColor: colors.primary },
  sheetRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  sheetOptionText: { ...typography.body, color: colors.textSecondary, flex: 1 },
  sheetOptionTextActive: { color: colors.text, fontWeight: '600' },

  cardTouch: { marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.sm,
  },
  cardDimmed: { opacity: 0.75 },
  cardAccent: { width: 5, backgroundColor: colors.primary },
  cardAccentEnded: { backgroundColor: colors.success },
  cardAccentCancelled: { backgroundColor: colors.textMuted },
  cardBody: { flex: 1, padding: spacing.lg },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { ...typography.h3, color: colors.text, flex: 1, marginRight: spacing.sm },
  badgeGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  distBadgeText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  spotsBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  spotsBadgeFull: { backgroundColor: colors.dangerLight },
  spotsText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  spotsTextFull: { color: colors.danger },
  endedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  endedBadgeText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  cancelledBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  cancelledBadgeText: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  metaText: { ...typography.caption, color: colors.textSecondary, flex: 1 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  playersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  playersBadgeText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  tagOrange: { backgroundColor: '#FFF3E0' },
  tagText: { ...typography.caption, color: colors.primary, fontWeight: '500' },
  tagTextOrange: { color: colors.accent },
  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: {
    ...typography.h3,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySub: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 76,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
});
