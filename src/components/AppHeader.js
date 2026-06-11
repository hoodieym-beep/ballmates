import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

const GRADIENT_COLORS = [colors.primary, colors.primaryLight, '#66BB6A'];

/**
 * Custom header with linear gradient. Hero mode (icon + title + subtitle) when options.headerIcon or subtitle set.
 */
export function AppHeader({ navigation, route, options = {}, back, title, headerRight: headerRightProp }) {
  const insets = useSafeAreaInsets();
  const hideBack = options.headerBackVisible === false;
  const backToScreen = options.headerBackToScreen;
  const canGoBack = !hideBack && back !== false && (navigation?.canGoBack?.() || backToScreen);
  const onBack = () => {
    if (backToScreen) navigation.navigate(backToScreen);
    else navigation.goBack();
  };
  const displayTitle = title ?? options.title ?? route?.name ?? '';
  const subtitle = options.subtitle;
  const headerIcon = options.headerIcon;
  const headerImage = options.headerImage;
  const rawRight = options.headerRight ?? headerRightProp;
  const headerRight = typeof rawRight === 'function' ? rawRight() : rawRight;
  const isHero = headerIcon || subtitle || headerImage;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={GRADIENT_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, isHero && styles.gradientHero]}
      >
        {isHero ? (
          <View style={[styles.heroRow, { paddingTop: insets.top }]}>
            {canGoBack ? (
              <TouchableOpacity onPress={onBack} style={styles.heroBackBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} activeOpacity={0.7}>
                <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={24} color={colors.textOnPrimary} />
              </TouchableOpacity>
            ) : null}
            {(headerImage || headerIcon) ? (
              <View style={styles.heroIconWrap}>
                {headerImage ? (
                  <Image source={{ uri: headerImage }} style={styles.heroAvatar} />
                ) : (
                  <View style={styles.heroIconPlaceholder}>
                    <Ionicons name={headerIcon || 'person'} size={26} color={colors.textOnPrimary} />
                  </View>
                )}
              </View>
            ) : null}
            <View style={styles.heroTextWrap}>
              <Text style={styles.heroTitle} numberOfLines={1}>{displayTitle}</Text>
              {subtitle ? <Text style={styles.heroSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
            {headerRight != null ? <View style={styles.heroRight}>{headerRight}</View> : null}
          </View>
        ) : (
          <View style={[styles.row, { paddingTop: insets.top }]}>
            <View style={styles.left}>
              {canGoBack ? (
                <TouchableOpacity
                  onPress={onBack}
                  style={styles.backBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={24} color={colors.textOnPrimary} />
                </TouchableOpacity>
              ) : (
                <View style={styles.backPlaceholder} />
              )}
            </View>
            <View style={styles.center}>
              <Text style={styles.title} numberOfLines={1}>{displayTitle}</Text>
            </View>
            <View style={styles.right}>
              {headerRight != null ? headerRight : <View style={styles.backPlaceholder} />}
            </View>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingBottom: 0 },
  gradient: { paddingBottom: spacing.sm, overflow: 'hidden' },
  gradientHero: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, ...shadows.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
  },
  left: { minWidth: 44, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  right: { minWidth: 44, alignItems: 'flex-end' },
  backBtn: { padding: spacing.sm },
  backPlaceholder: { width: 44, height: 44 },
  title: { ...typography.h3, fontSize: 18, color: colors.textOnPrimary },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroBackBtn: { padding: spacing.sm, marginRight: spacing.xs },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  heroAvatar: { width: 48, height: 48, borderRadius: 24 },
  heroIconPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  heroTextWrap: { flex: 1 },
  heroTitle: { ...typography.h2, fontSize: 24, color: colors.textOnPrimary, letterSpacing: 0.3 },
  heroSubtitle: { ...typography.bodySmall, color: 'rgba(255,255,255,0.9)', marginTop: spacing.xs },
  heroRight: { marginLeft: spacing.sm },
});
