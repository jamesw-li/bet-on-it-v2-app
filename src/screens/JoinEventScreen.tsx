import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';

const JoinEventScreen: React.FC = () => {
  const [eventCode, setEventCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const navigation = useNavigation();

  const handleJoinEvent = async () => {
    if (!eventCode.trim()) {
      Alert.alert('Error', 'Please enter an event code');
      return;
    }

    setLoading(true);

    try {
      // Find the event by code
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('event_code', eventCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (eventError || !event) {
        throw new Error('Event not found or inactive');
      }

      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('event_participants')
        .select('*')
        .eq('event_id', event.id)
        .eq('user_id', user?.id)
        .single();

      if (existingParticipant) {
        Alert.alert(
          'Already Joined',
          'You are already a participant in this event',
          [
            {
              text: 'Go to Event',
              onPress: () => {
                navigation.navigate('Event' as never, { eventId: event.id } as never);
              },
            },
          ]
        );
        return;
      }

      // Check participant limit for free events
      if (!event.is_premium) {
        const { count } = await supabase
          .from('event_participants')
          .select('*', { count: 'exact' })
          .eq('event_id', event.id);

        if (count && count >= event.max_guests) {
          throw new Error('This event has reached its participant limit');
        }
      }

      // Add user as participant
      const { error: participantError } = await supabase
        .from('event_participants')
        .insert({
          event_id: event.id,
          user_id: user?.id,
          role: 'participant',
        });

      if (participantError) throw participantError;

      Alert.alert(
        'Joined Successfully!',
        `You've joined "${event.name}"`,
        [
          {
            text: 'Go to Event',
            onPress: () => {
              navigation.navigate('Event' as never, { eventId: event.id } as never);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <LinearGradient
          colors={['#f59e0b', '#d97706']}
          style={styles.header}
        >
          <Ionicons name="enter-outline" size={48} color="white" />
          <Text style={styles.headerTitle}>Join Event</Text>
          <Text style={styles.headerSubtitle}>
            Enter the event code to join the fun
          </Text>
        </LinearGradient>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 6-character code"
              value={eventCode}
              onChangeText={(text) => setEventCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="help-circle-outline" size={24} color="#6366f1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How to Join</Text>
              <Text style={styles.infoText}>
                Ask the event organizer for the 6-character event code. 
                Once you enter it, you'll be able to participate in all the bets!
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.joinButton, loading && styles.buttonDisabled]}
            onPress={handleJoinEvent}
            disabled={loading}
          >
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Joining...' : 'Join Event'}
              </Text>
            </LinearGradient>
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
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
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
    fontSize: 18,
    backgroundColor: 'white',
    textAlign: 'center',
    letterSpacing: 2,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#3730a3',
    lineHeight: 16,
  },
  joinButton: {
    borderRadius: 12,
    overflow: 'hidden',
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
});

export default JoinEventScreen;