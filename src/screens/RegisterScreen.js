import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingModal } from '../components/LoadingModal';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';
import { getCurrentLocationWithAddress } from '../utils/location';

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', icon: 'leaf-outline' },
  { value: 'intermediate', label: 'Intermediate', icon: 'flash-outline' },
  { value: 'advanced', label: 'Advanced', icon: 'trophy-outline' },
];

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [preferredPosition, setPreferredPosition] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('intermediate');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!email.trim() || !password || !name.trim()) {
      Alert.alert('Missing fields', 'Name, email and password are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Terms required', 'Please accept the Terms and Code of conduct.');
      return;
    }
    setLoading(true);
    try {
      // UK location check — user must be physically in the UK to register
      const location = await getCurrentLocationWithAddress();
      if (!location) {
        // getCurrentLocationWithAddress already showed an alert (permission denied or outside UK)
        setLoading(false);
        return;
      }
      await register(email.trim(), password, name.trim(), true, {
        bio: bio.trim() || undefined,
        preferredPosition: preferredPosition.trim() || undefined,
        experienceLevel,
      });
    } catch (e) {
      Alert.alert('Registration failed', e.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <LoadingModal visible={loading} message="Creating account…" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join the community and find games near you</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <Input label="Full name" placeholder="Your name" value={name} onChangeText={setName} />
          <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Password" placeholder="At least 6 characters" value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your playing profile</Text>
          <Input
            label="Bio (optional)"
            placeholder="Tell others about yourself…"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
            style={styles.bioInput}
          />
          <Input
            label="Preferred position (optional)"
            placeholder="e.g. Midfielder, Striker, Goalkeeper"
            value={preferredPosition}
            onChangeText={setPreferredPosition}
          />
          <Text style={styles.fieldLabel}>Experience level</Text>
          <View style={styles.chipRow}>
            {EXPERIENCE_LEVELS.map(({ value, label, icon }) => {
              const active = experienceLevel === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setExperienceLevel(value)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={icon} size={16} color={active ? colors.textOnPrimary : colors.textSecondary} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.termsRow}>
          <TouchableOpacity
            style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}
            onPress={() => setAcceptTerms(!acceptTerms)}
            activeOpacity={0.7}
          >
            {acceptTerms && <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />}
          </TouchableOpacity>
          <View style={styles.termsTextWrap}>
            <Text style={styles.termsText}>I accept the </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Terms')} activeOpacity={0.7}>
              <Text style={styles.termsLink}>Terms and Code of conduct</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button title="Create account" onPress={handleRegister} style={styles.button} />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link} activeOpacity={0.7}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <Text style={styles.linkBold}>Sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl * 2 },
  header: { marginBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  fieldLabel: { ...typography.label, color: colors.textSecondary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textAlign: 'center' },
  chipTextActive: { color: colors.textOnPrimary },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, gap: spacing.md },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsTextWrap: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  termsText: { ...typography.bodySmall, color: colors.textSecondary },
  termsLink: { ...typography.bodySmall, color: colors.primary, fontWeight: '700' },
  button: { borderRadius: borderRadius.xl, marginBottom: spacing.md },
  link: { flexDirection: 'row', justifyContent: 'center', paddingVertical: spacing.md },
  linkText: { ...typography.bodySmall, color: colors.textSecondary },
  linkBold: { ...typography.bodySmall, fontWeight: '700', color: colors.primary },
});
