import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LoadingModal } from '../components/LoadingModal';
import { colors, spacing, typography, borderRadius, shadows } from '../constants/theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Login failed', e.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <LoadingModal visible={loading} message="Signing in…" />
      <LinearGradient colors={[colors.primary, '#388E3C', '#43A047']} style={styles.hero}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </LinearGradient>
      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to find your next game</Text>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Password"
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title="Sign in" onPress={handleLogin} loading={loading} style={styles.button} />
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link} activeOpacity={0.7}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Text style={styles.linkBold}>Sign up</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.primary, justifyContent: 'flex-end' },
  hero: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: { width: 180, height: 180 },
  sheet: {
    flex: 1,
    minHeight: 450,
    marginTop: -30,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...shadows.lg,
  },
  form: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl * 2,
  },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xxl },
  button: { marginTop: spacing.sm, borderRadius: borderRadius.xl },
  link: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  linkText: { ...typography.bodySmall, color: colors.textSecondary },
  linkBold: { ...typography.bodySmall, fontWeight: '700', color: colors.primary },
});
