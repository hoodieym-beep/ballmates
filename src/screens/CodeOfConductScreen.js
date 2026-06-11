import React, { useState, useEffect } from 'react';
import { Text, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '../constants/theme';

const COC_ACCEPTANCE_KEY = 'codeOfConductAccepted';

export default function CodeOfConductScreen() {
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    checkAcceptance();
  }, []);

  const checkAcceptance = async () => {
    try {
      const stored = await AsyncStorage.getItem(COC_ACCEPTANCE_KEY);
      if (stored === 'true') {
        setAccepted(true);
      }
    } catch (e) {
      console.error('Failed to check CoC acceptance:', e);
    }
  };

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(COC_ACCEPTANCE_KEY, 'true');
      setAccepted(true);
    } catch (e) {
      console.error('Failed to save CoC acceptance:', e);
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
        disabled={accepted}
        activeOpacity={accepted ? 1 : 0.8}
      >
        <View style={styles.buttonContent}>
          {accepted ? (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>Code of conduct accepted</Text>
            </>
          ) : (
            <Text style={styles.buttonText}>Accept code of conduct</Text>
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
