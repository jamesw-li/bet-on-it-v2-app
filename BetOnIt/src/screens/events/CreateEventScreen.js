import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { createEvent, joinEvent } from '../../services/database';
import { generateEventCode } from '../../utils/eventCode';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const CreateEventScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    welcomeMessage: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const eventCode = generateEventCode();
      
      const eventData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        welcome_message: formData.welcomeMessage.trim(),
        event_code: eventCode,
        host_id: user.id,
        status: 'active',
        is_premium: false,
      };

      const { data: event, error: eventError } = await createEvent(eventData);
      
      if (eventError) {
        Alert.alert('Error', 'Failed to create event: ' + eventError.message);
        return;
      }

      // Join the event as host
      const { error: joinError } = await joinEvent(event.id, user.id, 'host');
      
      if (joinError) {
        console.error('Error joining event as host:', joinError);
      }

      Alert.alert(
        'Event Created! 🎉',
        `Your event "${formData.name}" has been created with code: ${eventCode}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('EventDetails', { eventId: event.id })
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Create event error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Event</Text>
          <Text style={styles.subtitle}>Set up your betting event and invite friends</Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="Event Name *"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            placeholder="Game Night, Super Bowl Party, etc."
            error={errors.name}
          />

          <Input
            label="Description"
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            placeholder="Tell your friends what this event is about"
            multiline
            numberOfLines={3}
          />

          <Input
            label="Welcome Message"
            value={formData.welcomeMessage}
            onChangeText={(value) => updateFormData('welcomeMessage', value)}
            placeholder="Welcome to the event! Let's have some fun!"
            multiline
            numberOfLines={2}
          />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>📋 What happens next?</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• You'll get a unique event code to share</Text>
            <Text style={styles.infoItem}>• Friends can join using the code or QR code</Text>
            <Text style={styles.infoItem}>• You can create bets and manage the event</Text>
            <Text style={styles.infoItem}>• Free events support up to 5 bets and 10 guests</Text>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Create Event"
            onPress={handleCreateEvent}
            loading={loading}
            style={styles.createButton}
          />
          
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
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
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
  },
  actions: {
    paddingBottom: 40,
  },
  createButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 20,
  },
});

export default CreateEventScreen;