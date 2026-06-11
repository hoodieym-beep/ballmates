import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Terms of Service and Privacy</Text>
      <Text style={styles.para}>By using Ball Mates you agree to these terms. We process your data in line with GDPR and our privacy policy.</Text>
      <Text style={styles.para}>We store your email, name, profile picture and session participation to run the service. You can request deletion of your data. We use secure storage and do not share your data with third parties for marketing.</Text>
      <Text style={styles.para}>You are responsible for your behaviour at sessions. We may suspend accounts that breach our Code of conduct.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.lg },
  para: { ...typography.body, color: colors.textSecondary, lineHeight: 24, marginBottom: spacing.lg },
});
