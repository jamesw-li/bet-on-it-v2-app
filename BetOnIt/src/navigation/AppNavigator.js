import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import SignInScreen from '../screens/auth/SignInScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import JoinEventScreen from '../screens/events/JoinEventScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#667eea',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ 
                title: 'Bet On It',
                headerLeft: null,
              }} 
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
              name="EventDetails" 
              component={EventDetailsScreen} 
              options={{ title: 'Event Details' }} 
            />
          </>
        ) : (
          // Authentication screens
          <>
            <Stack.Screen 
              name="Welcome" 
              component={WelcomeScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="SignUp" 
              component={SignUpScreen} 
              options={{ title: 'Create Account' }} 
            />
            <Stack.Screen 
              name="SignIn" 
              component={SignInScreen} 
              options={{ title: 'Sign In' }} 
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;