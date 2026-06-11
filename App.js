import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    async function checkForUpdate() {
      if (!__DEV__) {
        try {
          const result = await Updates.checkForUpdateAsync();
          if (result.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch {}
      }
    }
    checkForUpdate();
  }, []);

  return (
    <AuthProvider>
      {/* Transparent + light icons — the green gradient header shows through on Android */}
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <AppNavigator />
    </AuthProvider>
  );
}
