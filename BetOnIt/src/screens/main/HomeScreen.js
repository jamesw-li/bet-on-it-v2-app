import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getUserProfile } from '../../services/database';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const HomeScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await getUserProfile(user.id);
      if (error) {
        console.error('Error loading profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        },
      ]
    );
  };

  if (loading) {
    return <LoadingSpinner message="Loading your profile..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Welcome back, {profile?.full_name || user?.user_metadata?.full_name || 'Friend'}! 👋
          </Text>
          <Text style={styles.subtitle}>Ready to make some bets?</Text>
        </View>

        <View style={styles.actions}>
          <Card style={styles.actionCard}>
            <Text style={styles.cardTitle}>🎯 Host an Event</Text>
            <Text style={styles.cardDescription}>
              Create a new event and invite friends to place bets
            </Text>
            <Button
              title="Create Event"
              onPress={() => navigation.navigate('CreateEvent')}
              style={styles.actionButton}
            />
          </Card>

          <Card style={styles.actionCard}>
            <Text style={styles.cardTitle}>🎲 Join an Event</Text>
            <Text style={styles.cardDescription}>
              Enter an event code to join the fun
            </Text>
            <Button
              title="Join Event"
              onPress={() => navigation.navigate('JoinEvent')}
              variant="secondary"
              style={styles.actionButton}
            />
          </Card>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <Button
            title="📱 Scan QR Code"
            onPress={() => navigation.navigate('QRScanner')}
            variant="outline"
            style={styles.quickActionButton}
          />
          
          <Button
            title="👤 Edit Profile"
            onPress={() => navigation.navigate('Profile')}
            variant="outline"
            style={styles.quickActionButton}
          />
          
          <Button
            title="🚪 Sign Out"
            onPress={handleSignOut}
            variant="outline"
            style={[styles.quickActionButton, styles.signOutButton]}
            textStyle={styles.signOutText}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bet On It - Making every gathering more exciting! 🎉
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  actions: {
    marginBottom: 32,
  },
  actionCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    width: '100%',
  },
  quickActions: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionButton: {
    marginBottom: 12,
  },
  signOutButton: {
    borderColor: '#ef4444',
  },
  signOutText: {
    color: '#ef4444',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HomeScreen;