import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function CodeOfConductScreen() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const accepted = !!user?.codeOfConductAcceptedAt;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await api('/api/users/accept-code-of-conduct', { method: 'POST' });
      await refreshUser();
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to accept code of conduct');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Code of conduct</Text>
      <Text style={styles.para}>Ball Mates is for everyone. We expect fair play, respect and safety at all sessions.</Text>
      <Text style={styles.para}>Do not harass, discriminate or use violence. Respect the organiser and other players. Follow the session rules. Report any concerns so we can keep the community safe and welcoming.</Text>

      <TouchableOpacity
        style={[styles.button, accepted && styles.buttonAccepted]}
        onPress={handleAccept}
        disabled={accepted || loading}
        activeOpacity={accepted ? 1 : 0.8}
      >
        <View style={styles.buttonContent}>
          {accepted ? (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>Code of conduct accepted</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>{loading ? 'Accepting...' : 'Accept code of conduct'}</Text>
          )}
        </View>
      </TouchableOpacity>

      {accepted && (
        <Text style={styles.acceptedNote}>
          You can join sessions now.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  para: { ...typography.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.lg },
  button: {
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  buttonAccepted: {
    backgroundColor: colors.success,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    ...typography.button,
    color: 'white',
    textAlign: 'center',
  },
  acceptedNote: {
    marginTop: spacing.lg,
    ...typography.bodySmall,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '500',
  },
});
