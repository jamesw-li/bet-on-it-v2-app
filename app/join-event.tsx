import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BarCodeScanner } from 'expo-barcode-scanner';

export default function JoinEventScreen() {
  const [eventCode, setEventCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { user } = useAuth();

  const requestCameraPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    
    if (status === 'granted') {
      setShowScanner(true);
    } else {
      Alert.alert('Permission needed', 'Please grant camera permissions to scan QR codes.');
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setShowScanner(false);
    setEventCode(data.toUpperCase());
  };

  const joinEvent = async () => {
    if (!eventCode.trim()) {
      Alert.alert('Error', 'Please enter an event code');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to join an event');
      return;
    }

    setLoading(true);
    try {
      // Find event by code
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('event_code', eventCode.trim().toUpperCase())
        .single();

      if (eventError || !event) {
        Alert.alert('Error', 'Event not found. Please check the code and try again.');
        return;
      }

      if (event.is_closed) {
        Alert.alert('Error', 'This event has been closed and is no longer accepting new participants.');
        return;
      }

      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .single();

      if (existingParticipant) {
        Alert.alert('Already Joined', 'You are already a participant in this event!', [
          {
            text: 'Go to Event',
            onPress: () => router.replace(`/event/${event.id}`),
          },
        ]);
        return;
      }

      // Check participant limit for free events
      if (!event.is_premium) {
        const { count } = await supabase
          .from('event_participants')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id);

        if (count && count >= 10) {
          Alert.alert('Event Full', 'This free event has reached its maximum of 10 participants. The host can upgrade to Premium to allow more participants.');
          return;
        }
      }

      // Add user as participant
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: event.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      Alert.alert(
        'Joined Successfully!',
        `You've joined "${event.name}"`,
        [
          {
            text: 'Go to Event',
            onPress: () => router.replace(`/event/${event.id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to join event');
      console.error('Error joining event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (showScanner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scannerHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowScanner(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.scannerTitle}>Scan QR Code</Text>
          <View style={styles.placeholder} />
        </View>
        
        <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerText}>
            Position the QR code within the frame
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#6366f1" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Event</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="enter-outline" size={64} color="#6366f1" />
          </View>

          <Text style={styles.title}>Join an Event</Text>
          <Text style={styles.subtitle}>
            Enter the event code provided by the host or scan a QR code
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Event Code</Text>
            <TextInput
              style={styles.input}
              value={eventCode}
              onChangeText={(text) => setEventCode(text.toUpperCase())}
              placeholder="Enter 6-character code"
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={requestCameraPermission}
          >
            <Ionicons name="qr-code-outline" size={24} color="#6366f1" />
            <Text style={styles.scanButtonText}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.joinButton, loading && styles.buttonDisabled]}
            onPress={joinEvent}
            disabled={loading}
          >
            <Text style={styles.joinButtonText}>
              {loading ? 'Joining Event...' : 'Join Event'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  scanButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 32,
  },
});