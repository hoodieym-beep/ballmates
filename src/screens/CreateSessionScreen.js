import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { api } from '../services/api';
import { getCurrentLocationWithAddress } from '../utils/location';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingModal } from '../components/LoadingModal';
import { MapPickerModal } from '../components/MapPickerModal';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

export default function CreateSessionScreen({ navigation }) {
  const [pitchName, setPitchName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');

  // Date/time stored as Date objects; tomorrow at 18:00 as default
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  const [sessionDate, setSessionDate] = useState(tomorrow);
  const [sessionTime, setSessionTime] = useState(tomorrow);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [maxPlayers, setMaxPlayers] = useState('14');
  const [rules, setRules] = useState('');
  const [hasReferee, setHasReferee] = useState(false);
  const [isBeginnerFriendly, setIsBeginnerFriendly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);
  const [autocompleteKey, setAutocompleteKey] = useState(0);

  const setCurrentLocation = async () => {
    const result = await getCurrentLocationWithAddress();
    if (!result) return;
    setLat(String(result.latitude));
    setLng(String(result.longitude));
    setAddress(result.address);
  };

  const resetForm = () => {
    setPitchName('');
    setAddress('');
    setLat('');
    setLng('');
    setAutocompleteKey((k) => k + 1); // remount autocomplete to clear its internal state
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(18, 0, 0, 0);
    setSessionDate(next);
    setSessionTime(next);
    setMaxPlayers('14');
    setRules('');
    setHasReferee(false);
    setIsBeginnerFriendly(true);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    resetForm();
  };

  const handleCreate = async () => {
    if (!pitchName.trim()) {
      Alert.alert('Missing field', 'Please enter a pitch name.');
      return;
    }
    if (!address.trim() || !lat || !lng) {
      Alert.alert('Address required', 'Please search and select an address from the suggestions, or use "Use my location" / "Pick on map".');
      return;
    }
    setLoading(true);
    try {
      // Merge date from sessionDate and time from sessionTime into one ISO string
      const merged = new Date(sessionDate);
      merged.setHours(sessionTime.getHours(), sessionTime.getMinutes(), 0, 0);

      await api('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          pitch: { name: pitchName.trim(), address: address.trim(), lat: parseFloat(lat), lng: parseFloat(lng) },
          date: merged.toISOString(),
          time: dayjs(sessionTime).format('HH:mm'),
          maxPlayers: parseInt(maxPlayers, 10) || 14,
          rules: rules.trim(),
          hasReferee,
          isBeginnerFriendly,
        }),
      });
      setShowSuccess(true);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingModal visible={loading} message="Creating session…" />
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            </View>
            <Text style={styles.successTitle}>Session created!</Text>
            <Text style={styles.successSubtitle}>Your match has been successfully scheduled.</Text>
            <TouchableOpacity style={styles.successBtn} onPress={handleSuccessClose} activeOpacity={0.85}>
              <Text style={styles.successBtnText}>Create another session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pitch section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pitch location</Text>
          <Input label="Pitch name" placeholder="e.g. Central Park Pitch 1" value={pitchName} onChangeText={setPitchName} />

          <AddressAutocomplete
            key={autocompleteKey}
            initialValue={address}
            onSelect={({ address: addr, lat: selLat, lng: selLng }) => {
              setAddress(addr);
              setLat(selLat != null ? String(selLat) : '');
              setLng(selLng != null ? String(selLng) : '');
            }}
          />

          <View style={styles.locationBtns}>
            <TouchableOpacity style={styles.locationBtn} onPress={setCurrentLocation} activeOpacity={0.75}>
              <Ionicons name="locate" size={16} color={colors.primary} />
              <Text style={styles.locationBtnText}>Use my location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.locationBtn} onPress={() => setMapPickerVisible(true)} activeOpacity={0.75}>
              <Ionicons name="map" size={16} color={colors.primary} />
              <Text style={styles.locationBtnText}>Pick on map</Text>
            </TouchableOpacity>
          </View>

          {(lat && lng) && (
            <View style={styles.coordsRow}>
              <Ionicons name="pin" size={14} color={colors.success} />
              <Text style={styles.coordsText}>{parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}</Text>
            </View>
          )}
        </View>

        <MapPickerModal
          visible={mapPickerVisible}
          onClose={() => setMapPickerVisible(false)}
          onSelect={(latitude, longitude, addr) => {
            setLat(String(latitude));
            setLng(String(longitude));
            setAddress(addr || '');
            setMapPickerVisible(false);
          }}
          initialLat={lat || undefined}
          initialLng={lng || undefined}
        />

        {/* Schedule section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date & time</Text>

          {/* Date picker row */}
          <TouchableOpacity style={styles.pickerRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.75}>
            <View style={styles.pickerIconWrap}>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.pickerTextWrap}>
              <Text style={styles.pickerLabel}>Date</Text>
              <Text style={styles.pickerValue}>{dayjs(sessionDate).format('dddd, D MMMM YYYY')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={sessionDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(e, selected) => {
                setShowDatePicker(false);
                if (selected) setSessionDate(selected);
              }}
            />
          )}

          {/* Time picker row */}
          <TouchableOpacity style={[styles.pickerRow, styles.pickerRowBorder]} onPress={() => setShowTimePicker(true)} activeOpacity={0.75}>
            <View style={styles.pickerIconWrap}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.pickerTextWrap}>
              <Text style={styles.pickerLabel}>Kick-off time</Text>
              <Text style={styles.pickerValue}>{dayjs(sessionTime).format('HH:mm')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.border} />
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={sessionTime}
              mode="time"
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, selected) => {
                setShowTimePicker(false);
                if (selected) setSessionTime(selected);
              }}
            />
          )}

          <Input label="Max players" placeholder="14" value={maxPlayers} onChangeText={setMaxPlayers} keyboardType="number-pad" />
        </View>

        {/* Rules & options */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Rules & options</Text>
          <Input
            label="Rules (optional)"
            placeholder="e.g. No slide tackles, fair play only…"
            value={rules}
            onChangeText={setRules}
            multiline
            numberOfLines={3}
            style={styles.rulesInput}
          />
          <Toggle label="Beginner friendly" icon="leaf-outline" value={isBeginnerFriendly} onToggle={() => setIsBeginnerFriendly(!isBeginnerFriendly)} />
          <Toggle label="Optional referee" icon="football-outline" value={hasReferee} onToggle={() => setHasReferee(!hasReferee)} />
        </View>

        <Button title="Create session" onPress={handleCreate} disabled={loading} style={styles.submitBtn} icon="add-circle-outline" />
      </ScrollView>
    </>
  );
}

function Toggle({ label, icon, value, onToggle }) {
  return (
    <TouchableOpacity style={styles.toggleRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={styles.toggleLeft}>
        <View style={[styles.toggleIconWrap, value && styles.toggleIconWrapOn]}>
          <Ionicons name={icon} size={18} color={value ? colors.textOnPrimary : colors.textMuted} />
        </View>
        <Text style={styles.toggleLabel}>{label}</Text>
      </View>
      <View style={[styles.toggleTrack, value && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
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
  locationBtns: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  locationBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
  },
  locationBtnText: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  coordsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: spacing.sm },
  coordsText: { ...typography.caption, color: colors.success, fontWeight: '600' },
  coordRow: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  pickerRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginTop: spacing.xs,
    paddingTop: spacing.lg,
  },
  pickerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerTextWrap: { flex: 1 },
  pickerLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 2 },
  pickerValue: { ...typography.body, color: colors.text, fontWeight: '600' },

  rulesInput: { minHeight: 80, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleIconWrap: { width: 36, height: 36, borderRadius: borderRadius.md, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  toggleIconWrapOn: { backgroundColor: colors.primary },
  toggleLabel: { ...typography.body, color: colors.text },
  toggleTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 2 },
  toggleTrackOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.surface, ...shadows.sm },
  toggleThumbOn: { alignSelf: 'flex-end' },
  submitBtn: { borderRadius: borderRadius.xl },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadows.lg,
  },
  successIconWrap: { marginBottom: spacing.lg },
  successTitle: { ...typography.h2, color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  successSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  successBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  successBtnText: { ...typography.body, color: colors.textOnPrimary, fontWeight: '600' },
});
