import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../constants/theme';

export function Button({ title, onPress, variant = 'primary', disabled, loading, style, textStyle, icon }) {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.base,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isDanger && styles.danger,
        isGhost && styles.ghost,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline || isGhost ? colors.primary : colors.textOnPrimary} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon ? <Ionicons name={icon} size={18} color={isOutline || isGhost ? colors.primary : colors.textOnPrimary} style={styles.icon} /> : null}
          <Text style={[
            styles.text,
            isPrimary && styles.textPrimary,
            isOutline && styles.textOutline,
            isDanger && styles.textPrimary,
            isGhost && styles.textOutline,
            textStyle,
          ]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.sm,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
    ...shadows.sm,
  },
  ghost: {
    backgroundColor: colors.successLight,
  },
  disabled: { opacity: 0.5 },
  inner: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: spacing.sm },
  text: { ...typography.button, letterSpacing: 0.3 },
  textPrimary: { color: colors.textOnPrimary },
  textOutline: { color: colors.primary },
});
