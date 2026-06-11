import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { AppHeader } from '../components/AppHeader';

import SessionsListScreen from '../screens/SessionsListScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';
import CreateSessionScreen from '../screens/CreateSessionScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrivateChatListScreen from '../screens/PrivateChatListScreen';
import PrivateChatScreen from '../screens/PrivateChatScreen';
import MotmVoteScreen from '../screens/MotmVoteScreen';
import ReportScreen from '../screens/ReportScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import NewChatScreen from '../screens/NewChatScreen';
import TermsScreen from '../screens/TermsScreen';
import CodeOfConductScreen from '../screens/CodeOfConductScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  header: ({ navigation, route, options }) => (
    <AppHeader navigation={navigation} route={route} options={options} />
  ),
  headerShown: true,
  contentStyle: { backgroundColor: colors.background },
};

function SessionsStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="SessionsList"
        component={SessionsListScreen}
        options={{ title: 'Sessions', subtitle: 'Find games near you', headerIcon: 'football', headerBackVisible: false }}
      />
      <Stack.Screen
        name="CreateSession"
        component={CreateSessionScreen}
        options={{ title: 'Create session', subtitle: 'Schedule a game', headerIcon: 'add-circle' }}
      />
      <Stack.Screen
        name="SessionDetail"
        component={SessionDetailScreen}
        options={{ title: 'Session', subtitle: 'Details & players', headerIcon: 'information-circle' }}
      />
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
        options={{ title: 'Group chat', subtitle: 'Session chat', headerIcon: 'chatbubbles' }}
      />
      <Stack.Screen
        name="MotmVote"
        component={MotmVoteScreen}
        options={{ title: 'Vote MOTM', subtitle: 'Pick your star', headerIcon: 'trophy' }}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: 'Report', subtitle: 'Report an issue', headerIcon: 'flag' }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({
          title: route.params?.userName ?? 'Profile',
          subtitle: 'View profile & message',
          headerIcon: 'person',
          headerImage: route.params?.userAvatar ?? null,
        })}
      />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="PrivateChatList"
        component={PrivateChatListScreen}
        options={{ title: 'Messages', subtitle: 'Chat with players', headerIcon: 'chatbubbles', headerBackVisible: false }}
      />
      <Stack.Screen
        name="PrivateChat"
        component={PrivateChatScreen}
        options={({ route }) => ({
          title: route.params?.otherName ?? 'Chat',
          headerImage: route.params?.otherAvatar ?? null,
          headerIcon: route.params?.otherAvatar ? null : 'person',
          headerBackToScreen: 'PrivateChatList',
        })}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{ title: 'New message', subtitle: 'Players from your sessions', headerIcon: 'create' }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', subtitle: 'Your stats & settings', headerIcon: 'person', headerBackVisible: false }}
      />
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
    </Stack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
          paddingTop: 8,
          height: 80,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="SessionsTab"
        component={SessionsStack}
        options={{
          tabBarLabel: 'Sessions',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'football' : 'football-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStack}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
