import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getEventByCode, joinEvent } from '../../services/database';
import { isValidEventCode } from '../../utils/eventCode';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const JoinEventScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [eventCode, setEventCode] = useState(route.params?.eventCode || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinEvent = async () => {
    if (!eventCode.trim()) {
      setError('Please enter an event code');
      return;
    }

    const code = eventCode.trim().toUpperCase();
    
    if (!isValidEventCode(code)) {
      setError('Event code must be 6 characters (letters and numbers)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find the event by code
      const { data: event, error: eventError } = await getEventByCode(code);
      
      if (eventError || !event) {
        setError('Event not found. Please check the code and try again.');
        setLoading(false);
        return;
      }

      if (event.status === 'closed') {
        setError('This event has already ended.');
        setLoading(false);
        return;
      }

      // Join the event
      const { error: joinError } = await joinEvent(event.id, user.id, 'participant');
      
      if (joinError) {
        if (joinError.code === '23505') { // Unique constraint violation
          // User is already in the event, just navigate
          navigation.navigate('EventDetails', { eventId: event.id });
        } else {
          setError('Failed to join event. Please try again.');
        }
        setLoading(false);
        return;
      }

      Alert.alert(
        'Joined Event! 🎉',
        `Welcome to "${event.name}"!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('EventDetails', { eventId: event.id })
          }
        ]
      );
    } catch (error) {
      console.error('Join event error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value) => {
    setEventCode(value.toUpperCase());
    if (error) setError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Event</Text>
          <Text style={styles.subtitle}>Enter the event code to join the fun</Text>
        </View>

        <Card style={styles.formCard}>
          <Input
            label="Event Code"
            value={eventCode}
            onChangeText={handleCodeChange}
            placeholder="Enter 6-character code"
            error={error}
            autoCapitalize="characters"
            maxLength={6}
            style={styles.codeInput}
          />

          <Button
            title="Join Event"
            onPress={handleJoinEvent}
            loading={loading}
            style={styles.joinButton}
          />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 How to join</Text>
          <View style={styles.infoList}>
            <Text style={styles.infoItem}>• Get the 6-character code from your host</Text>
            <Text style={styles.infoItem}>• Or scan the QR code they share</Text>
            <Text style={styles.infoItem}>• Enter the code above and tap "Join Event"</Text>
          </View>
        </Card>

        <View style={styles.alternativeActions}>
          <Button
            title="📱 Scan QR Code Instead"
            onPress={() => navigation.navigate('QRScanner')}
            variant="outline"
            style={styles.qrButton}
          />
          
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
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
    marginBottom: 24,
  },
  codeInput: {
    marginBottom: 24,
  },
  joinButton: {
    width: '100%',
  },
  infoCard: {
    marginBottom: 32,
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
  alternativeActions: {
    gap: 12,
  },
  qrButton: {
    borderColor: '#667eea',
  },
  cancelButton: {
    borderColor: '#9ca3af',
  },
});

export default JoinEventScreen;