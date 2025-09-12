import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';

const ProfileScreen: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [paymentApp, setPaymentApp] = useState<'venmo' | 'paypal' | 'cashapp' | ''>('');
  const [paymentUsername, setPaymentUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signOut } = useAuth();
  const { supabase } = useSupabase();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setPaymentApp(data.payment_app || '');
        setPaymentUsername(data.payment_username || '');
      } else {
        // Create user profile if it doesn't exist
        setFullName(user.user_metadata?.full_name || '');
        setUsername(user.user_metadata?.username || '');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim() || !username.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user?.id,
          email: user?.email,
          full_name: fullName.trim(),
          username: username.trim(),
          payment_app: paymentApp || null,
          payment_username: paymentUsername.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
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
          onPress: signOut,
        },
      ]
    );
  };

  const paymentApps = [
    { value: '', label: 'Select Payment App' },
    { value: 'venmo', label: 'Venmo' },
    { value: 'paypal', label: 'PayPal' },
    { value: 'cashapp', label: 'Cash App' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.header}
        >
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="white" />
          </View>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>
            Manage your account settings
          </Text>
        </LinearGradient>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email || ''}
              editable={false}
            />
            <Text style={styles.helperText}>
              Email cannot be changed
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Information</Text>
            <Text style={styles.sectionSubtitle}>
              This helps other users pay you when you win bets
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Payment App</Text>
              <View style={styles.pickerContainer}>
                {paymentApps.map((app) => (
                  <TouchableOpacity
                    key={app.value}
                    style={[
                      styles.pickerOption,
                      paymentApp === app.value && styles.pickerOptionSelected
                    ]}
                    onPress={() => setPaymentApp(app.value as any)}
                  >
                    <Text style={[
                      styles.pickerOptionText,
                      paymentApp === app.value && styles.pickerOptionTextSelected
                    ]}>
                      {app.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {paymentApp && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {paymentApp === 'venmo' ? 'Venmo Username' :
                   paymentApp === 'paypal' ? 'PayPal Email/Username' :
                   'Cash App Username'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter your ${paymentApp} username`}
                  value={paymentUsername}
                  onChangeText={setPaymentUsername}
                  autoCapitalize="none"
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSaveProfile}
            disabled={loading}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Save Profile'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 32,
    margin: 20,
    borderRadius: 16,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginTop: 32,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    overflow: 'hidden',
  },
  pickerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  pickerOptionSelected: {
    backgroundColor: '#eff6ff',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    alignItems: 'center',
    padding: 16,
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;