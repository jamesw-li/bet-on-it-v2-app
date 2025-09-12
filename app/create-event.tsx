import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function CreateEventScreen() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const generateEventCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }

    if (!eventDate.trim()) {
      Alert.alert('Error', 'Please enter an event date');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create an event');
      return;
    }

    setLoading(true);
    try {
      const eventCode = generateEventCode();
      
      // Check if event code already exists
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('event_code', eventCode)
        .single();

      if (existingEvent) {
        // Generate a new code if it exists
        return createEvent();
      }

      const { data, error } = await supabase
        .from('events')
        .insert({
          name: eventName.trim(),
          date: eventDate.trim(),
          welcome_message: welcomeMessage.trim() || null,
          event_code: eventCode,
          host_id: user.id,
          is_premium: false,
          is_closed: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Add host as participant
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: data.id,
          user_id: user.id,
        });

      if (participantError) throw participantError;

      Alert.alert(
        'Event Created!',
        `Your event "${eventName}" has been created with code: ${eventCode}`,
        [
          {
            text: 'OK',
            onPress: () => router.replace(`/event/${data.id}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create event');
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Create Event</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Event Name *</Text>
              <TextInput
                style={styles.input}
                value={eventName}
                onChangeText={setEventName}
                placeholder="Enter event name (e.g., Game Night, Super Bowl Party)"
                maxLength={100}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Event Date *</Text>
              <TextInput
                style={styles.input}
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="Enter date (e.g., Saturday, Dec 15, 2024)"
                maxLength={50}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Welcome Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={welcomeMessage}
                onChangeText={setWelcomeMessage}
                placeholder="Optional welcome message for your guests..."
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#6366f1" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Free Tier Limits</Text>
                <Text style={styles.infoText}>
                  • Up to 10 guests{'\n'}
                  • Up to 5 bets{'\n'}
                  • Upgrade to Premium for unlimited guests and bets
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.createButton, loading && styles.buttonDisabled]}
              onPress={createEvent}
              disabled={loading}
            >
              <Text style={styles.createButtonText}>
                {loading ? 'Creating Event...' : 'Create Event'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    padding: 20,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#3730a3',
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});