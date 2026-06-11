import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

export default function ReportScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');

  const submit = async () => {
    if (!reason.trim()) { Alert.alert('Missing reason', 'Please describe the reason for your report.'); return; }
    try {
      await api('/api/reports', { method: 'POST', body: JSON.stringify({ sessionId, reason: reason.trim(), description: description.trim() }) });
      Alert.alert('Report submitted', 'Thank you. Our team will review it shortly.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not submit report');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconRow}>
          <View style={styles.iconWrap}>
            <Ionicons name="flag" size={24} color={colors.danger} />
          </View>
          <Text style={styles.cardTitle}>Report this session</Text>
        </View>
        <Text style={styles.cardSub}>Your report is anonymous and will be reviewed by our team.</Text>
      </View>
      <View style={styles.formCard}>
        <Input label="Reason" placeholder="e.g. Unsafe environment, unfair play, no-show…" value={reason} onChangeText={setReason} />
        <Input
          label="Additional details (optional)"
          placeholder="Any other information that may help…"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.detailsInput}
        />
      </View>
      <Button title="Submit report" onPress={submit} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  iconWrap: { width: 44, height: 44, borderRadius: borderRadius.lg, backgroundColor: colors.dangerLight, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { ...typography.h3, color: colors.text },
  cardSub: { ...typography.bodySmall, color: colors.textSecondary },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  detailsInput: { minHeight: 100, textAlignVertical: 'top' },
  button: { borderRadius: borderRadius.xl, backgroundColor: colors.danger },
});
