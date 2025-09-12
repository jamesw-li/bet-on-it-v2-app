import 'react-native-url-polyfill/auto';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { SupabaseProvider } from './src/contexts/SupabaseContext';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import JoinEventScreen from './src/screens/JoinEventScreen';
import EventScreen from './src/screens/EventScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { useAuth } from './src/contexts/AuthContext';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You could add a loading screen here
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6366f1',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {!user ? (
          <Stack.Screen 
            name="Auth" 
            component={AuthScreen} 
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'Bet On It' }}
            />
            <Stack.Screen 
              name="CreateEvent" 
              component={CreateEventScreen}
              options={{ title: 'Create Event' }}
            />
            <Stack.Screen 
              name="JoinEvent" 
              component={JoinEventScreen}
              options={{ title: 'Join Event' }}
            />
            <Stack.Screen 
              name="Event" 
              component={EventScreen}
              options={{ title: 'Event' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profile' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SupabaseProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </AuthProvider>
    </SupabaseProvider>
  );
}