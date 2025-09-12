@@ .. @@
 import { StatusBar } from 'expo-status-bar';
-import { StyleSheet, Text, View } from 'react-native';
+import 'react-native-url-polyfill/auto';
+import React from 'react';
+import { NavigationContainer } from '@react-navigation/native';
+import { createStackNavigator } from '@react-navigation/stack';
+import { AuthProvider } from './src/contexts/AuthContext';
+import { SupabaseProvider } from './src/contexts/SupabaseContext';
+import AuthScreen from './src/screens/AuthScreen';
+import HomeScreen from './src/screens/HomeScreen';
+import { useAuth } from './src/contexts/AuthContext';
+
+const Stack = createStackNavigator();
+
+function AppNavigator() {
+  const { user, loading } = useAuth();
+
+  if (loading) {
+    return null; // You could add a loading screen here
+  }
+
+  return (
+    <NavigationContainer>
+      <Stack.Navigator
+        screenOptions={{
+          headerStyle: {
+            backgroundColor: '#6366f1',
+          },
+          headerTintColor: '#fff',
+          headerTitleStyle: {
+            fontWeight: 'bold',
+          },
+        }}
+      >
+        {!user ? (
+          <Stack.Screen 
+            name="Auth" 
+            component={AuthScreen} 
+            options={{ headerShown: false }}
+          />
+        ) : (
+          <Stack.Screen 
+            name="Home" 
+            component={HomeScreen}
+            options={{ title: 'Bet On It' }}
+          />
+        )}
+      </Stack.Navigator>
+    </NavigationContainer>
+  );
+}
 
 export default function App() {
   return (
-    <View style={styles.container}>
-      <Text>Open up App.tsx to start working on your app!</Text>
-      <StatusBar style="auto" />
-    </View>
+    <SupabaseProvider>
+      <AuthProvider>
+        <AppNavigator />
+        <StatusBar style="light" />
+      </AuthProvider>
+    </SupabaseProvider>
   );
 }
-
-const styles = StyleSheet.create({
-  container: {
-    flex: 1,
-    backgroundColor: '#fff',
-    alignItems: 'center',
-    justifyContent: 'center',
-  },
-});