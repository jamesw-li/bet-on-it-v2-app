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

const CreateEventScreen: React.FC = () => {
  const [eventName, setEventName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const navigation = useNavigation();

  const generateEventCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }

    setLoading(true);

    try {
      const eventCode = generateEventCode();
      
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          name: eventName.trim(),
          description: description.trim() || null,
          event_code: eventCode,
          creator_id: user?.id,
          is_premium: false,
          is_active: true,
          is_closed: false,
          max_guests: 10, // Free tier limit
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as participant
      await supabase
        .from('event_participants')
        .insert({
          event_id: event.id,
          user_id: user?.id,
          role: 'creator',
        });

      Alert.alert(
        'Event Created!',
        `Your event "${eventName}" has been created with code: ${eventCode}`,
        [
          {
            text: 'OK',
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
          colors={['#10b981', '#059669']}
          style={styles.header}
        >
          <Ionicons name="add-circle-outline" size={48} color="white" />
          <Text style={styles.headerTitle}>Create New Event</Text>
          <Text style={styles.headerSubtitle}>
            Set up a betting event for your gathering
          </Text>
        </LinearGradient>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Game Night, Super Bowl Party"
              value={eventName}
              onChangeText={setEventName}
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add details about your event..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#6366f1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Free Tier Limits</Text>
              <Text style={styles.infoText}>
                • Up to 10 guests{'\n'}
                • Up to 5 bets{'\n'}
                • Upgrade to Premium for unlimited access
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.buttonDisabled]}
            onPress={handleCreateEvent}
            disabled={loading}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating...' : 'Create Event'}
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
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  createButton: {
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

export default CreateEventScreen;