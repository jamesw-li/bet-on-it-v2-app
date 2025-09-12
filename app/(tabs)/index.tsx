import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  name: string;
  date: string;
  event_code: string;
  is_premium: boolean;
  is_closed: boolean;
  host_id: string;
  participant_count?: number;
}

export default function EventsScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchEvents = async () => {
    if (!user) return;

    try {
      // Get events where user is host or participant
      const { data: hostEvents, error: hostError } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });

      const { data: participantEvents, error: participantError } = await supabase
        .from('event_participants')
        .select(`
          events (
            id,
            name,
            date,
            event_code,
            is_premium,
            is_closed,
            host_id
          )
        `)
        .eq('user_id', user.id);

      if (hostError) throw hostError;
      if (participantError) throw participantError;

      // Combine and deduplicate events
      const allEvents = [
        ...(hostEvents || []),
        ...(participantEvents?.map(p => p.events).filter(Boolean) || [])
      ];

      const uniqueEvents = allEvents.filter((event, index, self) =>
        index === self.findIndex(e => e.id === event.id)
      );

      // Get participant counts
      const eventsWithCounts = await Promise.all(
        uniqueEvents.map(async (event) => {
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          return {
            ...event,
            participant_count: (count || 0) + 1, // +1 for host
          };
        })
      );

      setEvents(eventsWithCounts);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load events');
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => router.push(`/event/${item.id}`)}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventName}>{item.name}</Text>
        <View style={styles.eventBadges}>
          {item.is_premium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
          {item.is_closed && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>Closed</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.eventDetails}>
        <View style={styles.eventDetail}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.eventDetailText}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.eventDetail}>
          <Ionicons name="people-outline" size={16} color="#6b7280" />
          <Text style={styles.eventDetailText}>
            {item.participant_count} participant{item.participant_count !== 1 ? 's' : ''}
          </Text>
        </View>
        
        <View style={styles.eventDetail}>
          <Ionicons name="key-outline" size={16} color="#6b7280" />
          <Text style={styles.eventDetailText}>{item.event_code}</Text>
        </View>
      </View>

      {item.host_id === user?.id && (
        <View style={styles.hostIndicator}>
          <Ionicons name="star" size={16} color="#f59e0b" />
          <Text style={styles.hostText}>Host</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/create-event')}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
            <Text style={styles.actionButtonText}>Create Event</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => router.push('/join-event')}
          >
            <Ionicons name="enter-outline" size={24} color="#6366f1" />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Join Event
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.eventsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No Events Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first event or join one with a code
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6366f1',
  },
  eventsList: {
    padding: 16,
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  eventBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  premiumBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumText: {
    color: '#92400e',
    fontSize: 12,
    fontWeight: '600',
  },
  closedBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  closedText: {
    color: '#991b1b',
    fontSize: 12,
    fontWeight: '600',
  },
  eventDetails: {
    gap: 8,
    marginBottom: 12,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  hostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  hostText: {
    fontSize: 14,
    color: '#f59e0b',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});