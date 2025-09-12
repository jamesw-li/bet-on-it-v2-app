import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface Event {
  id: string;
  name: string;
  date: string;
  welcome_message: string | null;
  event_code: string;
  host_id: string;
  co_host_id: string | null;
  is_premium: boolean;
  is_closed: boolean;
}

interface Bet {
  id: string;
  question: string;
  options: string[];
  correct_option: number | null;
  is_settled: boolean;
  created_by: string;
  wagers?: Wager[];
}

interface Wager {
  id: string;
  user_id: string;
  selected_option: number;
  amount: number;
  profiles: {
    username: string;
  };
}

interface Participant {
  id: string;
  profiles: {
    id: string;
    username: string;
    full_name: string | null;
    payment_username: string | null;
    payment_app: string | null;
  };
}

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const isHost = event?.host_id === user?.id;
  const isCoHost = event?.co_host_id === user?.id;
  const canManage = isHost || isCoHost;

  useEffect(() => {
    if (id) {
      fetchEventData();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel(`event-${id}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'bets', filter: `event_id=eq.${id}` },
          () => fetchEventData()
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'wagers' },
          () => fetchEventData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchEventData = async () => {
    if (!id) return;

    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (eventError) throw eventError;
      setEvent(eventData);

      // Fetch bets with wagers
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          *,
          wagers (
            id,
            user_id,
            selected_option,
            amount,
            profiles (
              username
            )
          )
        `)
        .eq('event_id', id)
        .order('created_at', { ascending: true });

      if (betsError) throw betsError;
      setBets(betsData || []);

      // Fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('event_participants')
        .select(`
          id,
          profiles (
            id,
            username,
            full_name,
            payment_username,
            payment_app
          )
        `)
        .eq('event_id', id);

      if (participantsError) throw participantsError;
      setParticipants(participantsData || []);

    } catch (error: any) {
      Alert.alert('Error', 'Failed to load event data');
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEventData();
  };

  const shareEvent = async () => {
    if (!event) return;

    try {
      await Share.share({
        message: `Join my event "${event.name}" on Bet On It! Use code: ${event.event_code}`,
        title: 'Join my Bet On It event',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const createBet = () => {
    if (!event) return;

    if (!event.is_premium && bets.length >= 5) {
      Alert.alert(
        'Bet Limit Reached',
        'Free events are limited to 5 bets. Upgrade to Premium for unlimited bets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => upgradeToPremium() },
        ]
      );
      return;
    }

    router.push(`/create-bet?eventId=${event.id}`);
  };

  const upgradeToPremium = () => {
    Alert.alert(
      'Upgrade to Premium',
      'Premium events include:\n• Unlimited guests\n• Unlimited bets\n• Co-host feature\n• Split the pot option\n\nPrice: $29.99',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => {
          // In a real app, this would integrate with payment processing
          Alert.alert('Coming Soon', 'Premium upgrade will be available in the next update!');
        }},
      ]
    );
  };

  const closeEvent = () => {
    Alert.alert(
      'Close Event',
      'Are you sure you want to close this event? This will finalize all bets and calculate the final leaderboard.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Event',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('events')
                .update({ is_closed: true })
                .eq('id', id);

              if (error) throw error;
              
              setEvent(prev => prev ? { ...prev, is_closed: true } : null);
              Alert.alert('Event Closed', 'The event has been closed successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to close event');
            }
          },
        },
      ]
    );
  };

  const calculateLeaderboard = () => {
    const userScores: { [userId: string]: { username: string; score: number; winnings: number } } = {};

    // Initialize all participants
    participants.forEach(participant => {
      if (participant.profiles) {
        userScores[participant.profiles.id] = {
          username: participant.profiles.username,
          score: 0,
          winnings: 0,
        };
      }
    });

    // Calculate scores from settled bets
    bets.forEach(bet => {
      if (bet.is_settled && bet.correct_option !== null && bet.wagers) {
        const totalPot = bet.wagers.reduce((sum, wager) => sum + wager.amount, 0);
        const winners = bet.wagers.filter(wager => wager.selected_option === bet.correct_option);
        const totalWinnerAmount = winners.reduce((sum, wager) => sum + wager.amount, 0);

        winners.forEach(wager => {
          if (userScores[wager.user_id]) {
            userScores[wager.user_id].score += 1;
            if (totalWinnerAmount > 0) {
              const winShare = (wager.amount / totalWinnerAmount) * totalPot;
              userScores[wager.user_id].winnings += winShare;
            }
          }
        });
      }
    });

    return Object.values(userScores)
      .sort((a, b) => b.score - a.score || b.winnings - a.winnings);
  };

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
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const leaderboard = calculateLeaderboard();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#6366f1" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{event.name}</Text>
          <Text style={styles.headerSubtitle}>Code: {event.event_code}</Text>
        </View>
        
        <TouchableOpacity style={styles.headerButton} onPress={shareEvent}>
          <Ionicons name="share-outline" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {event.welcome_message && (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeText}>{event.welcome_message}</Text>
          </View>
        )}

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{participants.length}</Text>
            <Text style={styles.statLabel}>Participants</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{bets.length}</Text>
            <Text style={styles.statLabel}>Bets</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {bets.filter(bet => bet.is_settled).length}
            </Text>
            <Text style={styles.statLabel}>Settled</Text>
          </View>
        </View>

        {canManage && !event.is_closed && (
          <View style={styles.hostActions}>
            <TouchableOpacity style={styles.actionButton} onPress={createBet}>
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Create Bet</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={closeEvent}
            >
              <Ionicons name="lock-closed" size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>Close Event</Text>
            </TouchableOpacity>
          </View>
        )}

        {event.is_closed && (
          <View style={styles.closedBanner}>
            <Ionicons name="lock-closed" size={20} color="#dc2626" />
            <Text style={styles.closedText}>Event Closed</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          {leaderboard.length > 0 ? (
            leaderboard.map((user, index) => (
              <View key={user.username} style={styles.leaderboardItem}>
                <View style={styles.leaderboardRank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.leaderboardInfo}>
                  <Text style={styles.leaderboardName}>@{user.username}</Text>
                  <Text style={styles.leaderboardStats}>
                    {user.score} wins • ${user.winnings.toFixed(2)} winnings
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No bets settled yet</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Bets</Text>
          {bets.filter(bet => !bet.is_settled).length > 0 ? (
            bets
              .filter(bet => !bet.is_settled)
              .map(bet => (
                <TouchableOpacity
                  key={bet.id}
                  style={styles.betCard}
                  onPress={() => router.push(`/bet/${bet.id}`)}
                >
                  <Text style={styles.betQuestion}>{bet.question}</Text>
                  <Text style={styles.betInfo}>
                    {bet.wagers?.length || 0} wager{bet.wagers?.length !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))
          ) : (
            <Text style={styles.emptyText}>No active bets</Text>
          )}
        </View>

        {bets.filter(bet => bet.is_settled).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settled Bets</Text>
            {bets
              .filter(bet => bet.is_settled)
              .map(bet => (
                <View key={bet.id} style={[styles.betCard, styles.settledBet]}>
                  <Text style={styles.betQuestion}>{bet.question}</Text>
                  <Text style={styles.correctAnswer}>
                    Winner: {bet.options[bet.correct_option!]}
                  </Text>
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '600',
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
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  welcomeText: {
    fontSize: 16,
    color: '#1e40af',
    lineHeight: 24,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  hostActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  closedText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  leaderboardRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  leaderboardStats: {
    fontSize: 14,
    color: '#6b7280',
  },
  betCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settledBet: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  betQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  betInfo: {
    fontSize: 14,
    color: '#6b7280',
  },
  correctAnswer: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
});