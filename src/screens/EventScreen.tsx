import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';
import { useRoute } from '@react-navigation/native';
import { Event, EventParticipant, Bet } from '../types/database';

const EventScreen: React.FC = () => {
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const route = useRoute();
  const { eventId } = route.params as { eventId: string };

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      // Load event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Load participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select(`
          *,
          users (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('event_id', eventId);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

      // Load bets
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (betsError) throw betsError;
      setBets(betsData || []);

    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBet = () => {
    // TODO: Navigate to create bet screen
    Alert.alert('Coming Soon', 'Bet creation feature will be available soon!');
  };

  const isCreator = event?.creator_id === user?.id;
  const isCoHost = event?.co_host_id === user?.id;
  const canManage = isCreator || isCoHost;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading event...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Event Header */}
        <LinearGradient
          colors={['#6366f1', '#8b5cf6']}
          style={styles.header}
        >
          <Text style={styles.eventName}>{event.name}</Text>
          {event.description && (
            <Text style={styles.eventDescription}>{event.description}</Text>
          )}
          <View style={styles.eventCode}>
            <Text style={styles.eventCodeLabel}>Event Code:</Text>
            <Text style={styles.eventCodeText}>{event.event_code}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => setShowQR(!showQR)}
          >
            <Ionicons name="qr-code-outline" size={20} color="white" />
            <Text style={styles.qrButtonText}>
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </Text>
          </TouchableOpacity>

          {showQR && (
            <View style={styles.qrContainer}>
              <QRCode
                value={event.event_code}
                size={120}
                backgroundColor="white"
                color="black"
              />
            </View>
          )}
        </LinearGradient>

        {/* Participants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Participants ({participants.length})
          </Text>
          <View style={styles.participantsList}>
            {participants.map((participant) => (
              <View key={participant.id} style={styles.participantItem}>
                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>
                    {participant.users?.full_name || 'Unknown User'}
                  </Text>
                  <Text style={styles.participantRole}>
                    {participant.role === 'creator' ? 'Host' : 
                     participant.role === 'co_host' ? 'Co-Host' : 'Participant'}
                  </Text>
                </View>
                {participant.role === 'creator' && (
                  <Ionicons name="crown" size={20} color="#f59e0b" />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Bets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bets ({bets.length})</Text>
            {canManage && (
              <TouchableOpacity style={styles.addButton} onPress={handleCreateBet}>
                <Ionicons name="add" size={20} color="#6366f1" />
              </TouchableOpacity>
            )}
          </View>

          {bets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="dice-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No bets yet</Text>
              <Text style={styles.emptySubtext}>
                {canManage 
                  ? 'Create the first bet to get started!'
                  : 'Wait for the host to create some bets'
                }
              </Text>
            </View>
          ) : (
            <View style={styles.betsList}>
              {bets.map((bet) => (
                <View key={bet.id} style={styles.betItem}>
                  <Text style={styles.betTitle}>{bet.title}</Text>
                  {bet.description && (
                    <Text style={styles.betDescription}>{bet.description}</Text>
                  )}
                  <View style={styles.betStatus}>
                    <Text style={[
                      styles.betStatusText,
                      bet.is_settled ? styles.settledStatus : styles.activeStatus
                    ]}>
                      {bet.is_settled ? 'Settled' : 'Active'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  eventName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  eventDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  eventCode: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventCodeLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginRight: 8,
  },
  eventCodeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  qrButtonText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  section: {
    margin: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: 20,
  },
  participantsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  participantRole: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  betsList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  betItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  betTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  betDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  betStatus: {
    alignSelf: 'flex-start',
  },
  betStatusText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeStatus: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  settledStatus: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default EventScreen;