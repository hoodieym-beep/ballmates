import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Image,
  ScrollView, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api, apiUpload } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingModal } from '../components/LoadingModal';
import { ProfileSkeleton } from '../components/Skeleton';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

function getInitials(name) {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const [stats, setStats] = useState({ gamesPlayed: 0, motmCount: 0 });
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPreferredPosition, setEditPreferredPosition] = useState('');
  const [editExperienceLevel, setEditExperienceLevel] = useState('intermediate');

  React.useEffect(() => {
    api('/api/users/me/stats').then(setStats).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (editing && user) {
      setEditName(user.name || '');
      setEditBio(user.bio || '');
      setEditPreferredPosition(user.preferredPosition || '');
      setEditExperienceLevel(user.experienceLevel || 'intermediate');
    }
  }, [editing, user]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setSaving(true);
    try {
      await api('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          bio: editBio.trim() || '',
          preferredPosition: editPreferredPosition.trim() || '',
          experienceLevel: editExperienceLevel,
        }),
      });
      await refreshUser();
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow access to photos to set avatar.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (result.canceled) return;

    // Resize to 500×500 and compress to 70% — reduces 10MB photo to ~50–100KB
    const compressed = await ImageManipulator.manipulateAsync(
      result.assets[0].uri,
      [{ resize: { width: 500, height: 500 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    const formData = new FormData();
    formData.append('avatar', { uri: compressed.uri, name: 'avatar.jpg', type: 'image/jpeg' });
    setUploading(true);
    try {
      await apiUpload('/api/upload/avatar', formData);
      await refreshUser();
    } catch (e) {
      Alert.alert('Error', e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);
  };

  if (!user) return <ScrollView style={styles.container}><ProfileSkeleton /></ScrollView>;

  const levelColor = user.experienceLevel === 'advanced' ? colors.accent : user.experienceLevel === 'beginner' ? colors.success : colors.primary;

  return (
    <>
      <LoadingModal visible={uploading} message="Uploading photo…" />
      <LoadingModal visible={saving} message="Saving…" />

      {/* Edit Profile Modal */}
      <Modal visible={editing} transparent animationType="slide">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit profile</Text>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Input label="Name" placeholder="Your name" value={editName} onChangeText={setEditName} />
              <Input
                label="Bio (optional)"
                placeholder="A short intro…"
                value={editBio}
                onChangeText={setEditBio}
                multiline
                numberOfLines={3}
                style={styles.bioInput}
              />
              <Input
                label="Preferred position (optional)"
                placeholder="e.g. Midfielder, Striker"
                value={editPreferredPosition}
                onChangeText={setEditPreferredPosition}
              />
              <Text style={styles.fieldLabel}>Experience level</Text>
              <View style={styles.chipRow}>
                {EXPERIENCE_LEVELS.map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.chip, editExperienceLevel === value && styles.chipActive]}
                    onPress={() => setEditExperienceLevel(value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, editExperienceLevel === value && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="outline" onPress={() => setEditing(false)} style={styles.modalBtn} />
              <Button title="Save changes" onPress={handleSaveProfile} disabled={saving} style={styles.modalBtn} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar hero */}
        <View style={styles.heroSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrap} activeOpacity={0.85}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{getInitials(user.name)}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Ionicons name="camera" size={14} color={colors.textOnPrimary} />
            </View>
          </TouchableOpacity>
          <Text style={styles.heroName}>{user.name}</Text>
          <Text style={styles.heroEmail}>{user.email}</Text>
          {user.experienceLevel && (
            <View style={[styles.levelBadge, { backgroundColor: levelColor + '22' }]}>
              <Text style={[styles.levelBadgeText, { color: levelColor }]}>
                {user.experienceLevel.charAt(0).toUpperCase() + user.experienceLevel.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.gamesPlayed}</Text>
            <Text style={styles.statLabel}>Games</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.motmCount}</Text>
            <Text style={styles.statLabel}>MOTM</Text>
          </View>
        </View>

        {/* About card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>About</Text>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn} activeOpacity={0.7}>
              <Ionicons name="pencil" size={14} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          {user.bio ? (
            <Text style={styles.bioText}>{user.bio}</Text>
          ) : null}
          {user.preferredPosition ? (
            <View style={styles.infoRow}>
              <Ionicons name="football-outline" size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>{user.preferredPosition}</Text>
            </View>
          ) : null}
          {!user.bio && !user.preferredPosition ? (
            <TouchableOpacity onPress={() => setEditing(true)} activeOpacity={0.7}>
              <Text style={styles.emptyHint}>Tap Edit to add your bio and position</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Menu */}
        <View style={styles.card}>
          <MenuItem icon="document-text-outline" label="Terms & Privacy" onPress={() => navigation.navigate('Terms')} />
          <View style={styles.menuDivider} />
          <MenuItem icon="shield-checkmark-outline" label="Code of conduct" onPress={() => navigation.navigate('CodeOfConduct')} />
        </View>

        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl * 2 },
  heroSection: { alignItems: 'center', paddingVertical: spacing.xxl, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  avatarWrap: { marginBottom: spacing.md, position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: colors.primary },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { ...typography.h1, color: colors.textOnPrimary },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  heroName: { ...typography.h2, color: colors.text, marginBottom: 2 },
  heroEmail: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.md },
  levelBadge: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  levelBadgeText: { ...typography.caption, fontWeight: '700', textTransform: 'capitalize' },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    ...shadows.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...typography.h1, color: colors.primary, lineHeight: 38 },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  statDivider: { width: 1, height: 44, backgroundColor: colors.borderLight },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  cardTitle: { ...typography.label, color: colors.text, fontSize: 14 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: spacing.sm, backgroundColor: colors.successLight, borderRadius: borderRadius.full },
  editBtnText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  bioText: { ...typography.body, color: colors.text, lineHeight: 24, marginBottom: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  infoText: { ...typography.bodySmall, color: colors.textSecondary },
  emptyHint: { ...typography.bodySmall, color: colors.textMuted, fontStyle: 'italic' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  menuIconWrap: { width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: colors.successLight, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { ...typography.body, color: colors.text, flex: 1 },
  menuDivider: { height: 1, backgroundColor: colors.borderLight, marginLeft: 52 },
  logoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingVertical: spacing.lg },
  logoutText: { ...typography.body, color: colors.danger, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: spacing.xxl, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalTitle: { ...typography.h3, color: colors.text },
  modalCloseBtn: { padding: spacing.sm },
  modalScroll: { padding: spacing.lg, maxHeight: 420 },
  modalActions: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  modalBtn: { flex: 1 },
  bioInput: { minHeight: 80, textAlignVertical: 'top' },
  fieldLabel: { ...typography.label, color: colors.textSecondary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  chip: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: colors.textOnPrimary },
});
