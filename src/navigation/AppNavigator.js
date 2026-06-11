import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { colors } from '../constants/theme';
import { LoadingModal } from '../components/LoadingModal';
import { AppHeader } from '../components/AppHeader';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import TermsScreen from '../screens/TermsScreen';
import CodeOfConductScreen from '../screens/CodeOfConductScreen';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

const headerOptions = {
  header: ({ navigation, route, options }) => (
    <AppHeader navigation={navigation} route={route} options={options} />
  ),
  headerShown: true,
  contentStyle: { backgroundColor: colors.background },
};

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingModal visible message="Loading..." />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ ...headerOptions, headerShown: true }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Ball Mates', headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign up', subtitle: 'Join the community', headerIcon: 'person-add' }} />
            <Stack.Screen
              name="Terms"
              component={TermsScreen}
              options={{ title: 'Terms', subtitle: 'Terms and privacy', headerIcon: 'document-text' }}
            />
            <Stack.Screen
              name="CodeOfConduct"
              component={CodeOfConductScreen}
              options={{ title: 'Code of conduct', subtitle: 'Community guidelines', headerIcon: 'shield-checkmark' }}
            />
          </>
        ) : (
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
