import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, Share } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { getEvent, subscribeToEvent, closeEvent } from '../../services/database';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import QRCode from 'react-native-qrcode-svg';

const EventDetailsScreen = ({ navigation, route }) => {
  const { eventId } = route.params;
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    loadEvent();
    
    // Subscribe to real-time updates
    const subscription = subscribeToEvent(eventId, () => {
      loadEvent();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const { data, error } = await getEvent(eventId);
      
      if (error) {
        Alert.alert('Error', 'Failed to load event details');
        navigation.goBack();
        return;
      }

      setEvent(data);
      
      // Find user's role in the event
      const participant = data.event_participants?.find(p => p.user_id === user.id);
      setUserRole(participant?.role || null);
      
    } catch (error) {
      console.error('Load event error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleShareEvent = async () => {
    try {
      await Share.share({
        message: `Join my event "${event.name}" on Bet On It! Use code: ${event.event_code}`,
        title: 'Join my Bet On It event',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleCloseEvent = () => {
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
              await closeEvent(eventId);
              loadEvent();
              Alert.alert('Event Closed', 'The event has been closed and final results calculated.');
            } catch (error) {
              Alert.alert('Error', 'Failed to close event');
            }
          }
        }
      ]
    );
  };

  const isHost = userRole === 'host';
  const isCoHost = userRole === 'co_host';
  const canManage = isHost || isCoHost;
  const activeBets = event?.bets?.filter(bet => bet.status === 'active') || [];
  const settledBets = event?.bets?.filter(bet => bet.status === 'settled') || [];

  if (loading) {
    return <LoadingSpinner message="Loading event details..." />;
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Card style={styles.eventCard}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventName}>{event.name}</Text>
            <View style={styles.statusBadge}>
              <Text style={[styles.statusText, event.status === 'active' ? styles.activeStatus : styles.closedStatus]}>
                {event.status === 'active' ? '🟢 Active' : '🔴 Closed'}
              </Text>
            </View>
          </View>
          
          {event.description && (
            <Text style={styles.eventDescription}>{event.description}</Text>
          )}
          
          {event.welcome_message && (
            <Text style={styles.welcomeMessage}>{event.welcome_message}</Text>
          )}

          <View style={styles.eventInfo}>
            <Text style={styles.infoItem}>📅 Created: {new Date(event.created_at).toLocaleDateString()}</Text>
            <Text style={styles.infoItem}>👥 Participants: {event.event_participants?.length || 0}</Text>
            <Text style={styles.infoItem}>🎯 Active Bets: {activeBets.length}</Text>
            <Text style={styles.infoItem}>✅ Settled Bets: {settledBets.length}</Text>
          </View>
        </Card>

        <Card style={styles.codeCard}>
          <Text style={styles.cardTitle}>Event Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.eventCode}>{event.event_code}</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={event.event_code}
                size={80}
                color="#1f2937"
                backgroundColor="#ffffff"
              />
            </View>
          </View>
          <Button
            title="Share Event"
            onPress={handleShareEvent}
            variant="outline"
            size="small"
            style={styles.shareButton}
          />
        </Card>

        {canManage && (
          <Card style={styles.managementCard}>
            <Text style={styles.cardTitle}>Event Management</Text>
            <View style={styles.managementActions}>
              <Button
                title="Create New Bet"
                onPress={() => navigation.navigate('CreateBet', { eventId })}
                style={styles.managementButton}
              />
              
              {event.status === 'active' && (
                <Button
                  title="Close Event"
                  onPress={handleCloseEvent}
                  variant="outline"
                  style={[styles.managementButton, styles.closeButton]}
                  textStyle={styles.closeButtonText}
                />
              )}
            </View>
          </Card>
        )}

        <Card style={styles.betsCard}>
          <Text style={styles.cardTitle}>Active Bets ({activeBets.length})</Text>
          {activeBets.length === 0 ? (
            <Text style={styles.noBetsText}>No active bets yet. {canManage ? 'Create one to get started!' : 'Wait for the host to create some bets.'}</Text>
          ) : (
            <View style={styles.betsList}>
              {activeBets.map((bet) => (
                <View key={bet.id} style={styles.betItem}>
                  <Text style={styles.betQuestion}>{bet.question}</Text>
                  <Text style={styles.betInfo}>
                    {bet.user_bets?.length || 0} participants
                  </Text>
                  <Button
                    title="View Bet"
                    onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
                    variant="outline"
                    size="small"
                    style={styles.betButton}
                  />
                </View>
              ))}
            </View>
          )}
        </Card>

        {settledBets.length > 0 && (
          <Card style={styles.betsCard}>
            <Text style={styles.cardTitle}>Settled Bets ({settledBets.length})</Text>
            <View style={styles.betsList}>
              {settledBets.map((bet) => (
                <View key={bet.id} style={styles.betItem}>
                  <Text style={styles.betQuestion}>{bet.question}</Text>
                  <Text style={[styles.betInfo, styles.settledInfo]}>✅ Settled</Text>
                  <Button
                    title="View Results"
                    onPress={() => navigation.navigate('BetDetails', { betId: bet.id })}
                    variant="outline"
                    size="small"
                    style={styles.betButton}
                  />
                </View>
              ))}
            </View>
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="View Leaderboard"
            onPress={() => navigation.navigate('Leaderboard', { eventId })}
            style={styles.actionButton}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 24,
  },
  eventCard: {
    marginTop: 20,
    marginBottom: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeStatus: {
    color: '#059669',
  },
  closedStatus: {
    color: '#dc2626',
  },
  eventDescription: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 22,
  },
  welcomeMessage: {
    fontSize: 14,
    color: '#667eea',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 20,
  },
  eventInfo: {
    gap: 4,
  },
  infoItem: {
    fontSize: 14,
    color: '#6b7280',
  },
  codeCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
  },
  eventCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#667eea',
    letterSpacing: 4,
  },
  qrContainer: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shareButton: {
    width: '100%',
  },
  managementCard: {
    marginBottom: 16,
  },
  managementActions: {
    gap: 12,
  },
  managementButton: {
    width: '100%',
  },
  closeButton: {
    borderColor: '#ef4444',
  },
  closeButtonText: {
    color: '#ef4444',
  },
  betsCard: {
    marginBottom: 16,
  },
  noBetsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  betsList: {
    gap: 12,
  },
  betItem: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
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
    marginBottom: 8,
  },
  settledInfo: {
    color: '#059669',
    fontWeight: '600',
  },
  betButton: {
    alignSelf: 'flex-start',
  },
  actions: {
    paddingBottom: 40,
  },
  actionButton: {
    width: '100%',
  },
});

export default EventDetailsScreen;