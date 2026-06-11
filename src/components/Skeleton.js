import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing } from '../constants/theme';

// Base animated shimmer block
export function Skeleton({ width, height, radius, style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius ?? borderRadius.md,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Circle variant
export function SkeletonCircle({ size, style }) {
  return <Skeleton width={size} height={size} radius={size / 2} style={style} />;
}

// ─────────────────────────────────────────────
// Pre-built skeleton layouts per screen
// ─────────────────────────────────────────────

export function SessionCardSkeleton() {
  return (
    <View style={layouts.sessionCard}>
      <View style={layouts.sessionAccent} />
      <View style={layouts.sessionBody}>
        {/* Title row + badge */}
        <View style={layouts.sessionTopRow}>
          <Skeleton width="58%" height={18} radius={6} />
          <Skeleton width={54} height={22} radius={6} />
        </View>
        {/* Date meta row — icon dot + text */}
        <View style={layouts.sessionMetaRow}>
          <Skeleton width={13} height={13} radius={4} />
          <Skeleton width="42%" height={13} radius={4} />
        </View>
        {/* Address meta row — icon dot + text */}
        <View style={layouts.sessionMetaRow}>
          <Skeleton width={13} height={13} radius={4} />
          <Skeleton width="68%" height={13} radius={4} />
        </View>
        {/* Badge row */}
        <View style={layouts.sessionBadgeRow}>
          <Skeleton width={56} height={22} radius={6} />
          <Skeleton width={112} height={22} radius={6} />
        </View>
      </View>
    </View>
  );
}

export function SessionsListSkeleton() {
  return (
    <View>
      {/* Filter chip row placeholder */}
      <View style={layouts.filterRow}>
        <Skeleton width={110} height={36} radius={18} />
        <Skeleton width={90} height={36} radius={18} />
      </View>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ marginBottom: spacing.md }}>
          <SessionCardSkeleton />
        </View>
      ))}
    </View>
  );
}

export function ConversationRowSkeleton() {
  return (
    <View style={layouts.convoRow}>
      <SkeletonCircle size={52} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <View style={layouts.convoTopRow}>
          <Skeleton width="40%" height={15} />
          <Skeleton width={36} height={12} />
        </View>
        <Skeleton width="70%" height={13} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function ChatListSkeleton() {
  return (
    <View>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i}>
          <ConversationRowSkeleton />
          <View style={layouts.divider} />
        </View>
      ))}
    </View>
  );
}

export function ChatMessagesSkeleton() {
  const rows = [
    { align: 'flex-end', width: '55%' },
    { align: 'flex-start', width: '65%' },
    { align: 'flex-start', width: '45%' },
    { align: 'flex-end', width: '70%' },
    { align: 'flex-start', width: '50%' },
    { align: 'flex-end', width: '40%' },
  ];
  return (
    <View style={{ padding: spacing.lg, flex: 1 }}>
      {rows.map((r, i) => (
        <Skeleton
          key={i}
          width={r.width}
          height={44}
          radius={borderRadius.xl}
          style={{ alignSelf: r.align, marginBottom: spacing.sm }}
        />
      ))}
    </View>
  );
}

export function SessionDetailSkeleton() {
  return (
    <View style={{ padding: spacing.lg }}>
      {/* Hero card */}
      <View style={layouts.card}>
        <Skeleton width="75%" height={22} />
        <Skeleton width="50%" height={14} style={{ marginTop: 10 }} />
        <Skeleton width="65%" height={14} style={{ marginTop: 6 }} />
      </View>
      {/* Players card */}
      <View style={[layouts.card, { marginTop: spacing.lg }]}>
        <Skeleton width="30%" height={14} />
        <View style={layouts.avatarRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ alignItems: 'center' }}>
              <SkeletonCircle size={44} />
              <Skeleton width={36} height={10} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
      {/* Actions card */}
      <View style={[layouts.card, { marginTop: spacing.lg }]}>
        <Skeleton width="25%" height={14} style={{ marginBottom: spacing.md }} />
        {[1, 2].map((i) => (
          <View key={i} style={layouts.actionRow}>
            <SkeletonCircle size={38} />
            <Skeleton width="50%" height={14} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View>
      {/* Hero */}
      <View style={layouts.profileHero}>
        <SkeletonCircle size={96} />
        <Skeleton width={140} height={20} style={{ marginTop: spacing.md }} />
        <Skeleton width={100} height={14} style={{ marginTop: 8 }} />
        <Skeleton width={80} height={24} radius={12} style={{ marginTop: spacing.md }} />
      </View>
      {/* Stats */}
      <View style={[layouts.card, { margin: spacing.lg, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.xl }]}>
        {[1, 2].map((i) => (
          <View key={i} style={{ alignItems: 'center' }}>
            <Skeleton width={50} height={36} radius={8} />
            <Skeleton width={60} height={12} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>
      {/* About */}
      <View style={[layouts.card, { marginHorizontal: spacing.lg }]}>
        <Skeleton width="30%" height={14} style={{ marginBottom: spacing.md }} />
        <Skeleton width="90%" height={14} />
        <Skeleton width="70%" height={14} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function UserProfileSkeleton() {
  return (
    <View style={{ padding: spacing.lg }}>
      <View style={[layouts.card, { alignItems: 'center', paddingVertical: spacing.xxl }]}>
        <SkeletonCircle size={96} />
        <Skeleton width={150} height={22} style={{ marginTop: spacing.md }} />
        <Skeleton width={80} height={24} radius={12} style={{ marginTop: spacing.sm }} />
        <Skeleton width="80%" height={48} radius={borderRadius.xl} style={{ marginTop: spacing.lg }} />
      </View>
      <View style={[layouts.card, { marginTop: spacing.lg }]}>
        <Skeleton width="25%" height={12} style={{ marginBottom: spacing.md }} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md }}>
          <SkeletonCircle size={34} />
          <Skeleton width="40%" height={14} />
        </View>
      </View>
    </View>
  );
}

export function MotmSkeleton() {
  return (
    <View style={{ padding: spacing.lg }}>
      {/* Trophy header */}
      <View style={[layouts.card, { alignItems: 'center', paddingVertical: spacing.xxl }]}>
        <SkeletonCircle size={72} />
        <Skeleton width={180} height={22} style={{ marginTop: spacing.md }} />
        <Skeleton width={200} height={32} radius={16} style={{ marginTop: spacing.md }} />
      </View>
      {/* Player cards */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={[layouts.card, { marginTop: spacing.md, flexDirection: 'row', alignItems: 'center' }]}>
          <SkeletonCircle size={48} style={{ marginRight: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Skeleton width="50%" height={15} />
            <Skeleton width="80%" height={8} radius={4} style={{ marginTop: 8 }} />
          </View>
          <Skeleton width={40} height={40} radius={8} />
        </View>
      ))}
    </View>
  );
}

export function PlayerListSkeleton() {
  return (
    <View>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i}>
          <View style={layouts.convoRow}>
            <SkeletonCircle size={50} style={{ marginRight: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Skeleton width="45%" height={15} />
              <Skeleton width="60%" height={13} style={{ marginTop: 7 }} />
            </View>
          </View>
          <View style={layouts.divider} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.border },
});

const layouts = StyleSheet.create({
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  sessionAccent: { width: 5, backgroundColor: colors.border },
  sessionBody: { flex: 1, padding: spacing.lg },
  sessionTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sessionMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  sessionBadgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  convoTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 },
  divider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 80 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  avatarRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg, flexWrap: 'wrap' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  profileHero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
});
