import { supabase } from '../config/supabase';

// User Profile Operations
export const createUserProfile = async (userId, profileData) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        ...profileData,
      },
    ]);
  return { data, error };
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return { data, error };
};

export const updateUserProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

// Event Operations
export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();
  return { data, error };
};

export const getEvent = async (eventId) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_participants(
        user_id,
        role,
        profiles(username, full_name, avatar_url, payment_info)
      ),
      bets(
        *,
        bet_options(*),
        user_bets(
          *,
          profiles(username, full_name)
        )
      )
    `)
    .eq('id', eventId)
    .single();
  return { data, error };
};

export const getEventByCode = async (eventCode) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', eventCode)
    .single();
  return { data, error };
};

export const joinEvent = async (eventId, userId, role = 'participant') => {
  const { data, error } = await supabase
    .from('event_participants')
    .insert([
      {
        event_id: eventId,
        user_id: userId,
        role,
      },
    ]);
  return { data, error };
};

export const closeEvent = async (eventId) => {
  const { data, error } = await supabase
    .from('events')
    .update({ status: 'closed' })
    .eq('id', eventId);
  return { data, error };
};

// Bet Operations
export const createBet = async (betData) => {
  const { data, error } = await supabase
    .from('bets')
    .insert([betData])
    .select()
    .single();
  return { data, error };
};

export const createBetOptions = async (betId, options) => {
  const optionsData = options.map(option => ({
    bet_id: betId,
    option_text: option,
  }));
  
  const { data, error } = await supabase
    .from('bet_options')
    .insert(optionsData);
  return { data, error };
};

export const placeBet = async (betId, userId, optionId, amount = 1) => {
  const { data, error } = await supabase
    .from('user_bets')
    .insert([
      {
        bet_id: betId,
        user_id: userId,
        bet_option_id: optionId,
        amount,
      },
    ]);
  return { data, error };
};

export const settleBet = async (betId, winningOptionId) => {
  const { data, error } = await supabase
    .from('bets')
    .update({ 
      status: 'settled',
      winning_option_id: winningOptionId,
    })
    .eq('id', betId);
  return { data, error };
};

// Leaderboard Operations
export const getEventLeaderboard = async (eventId) => {
  const { data, error } = await supabase
    .rpc('get_event_leaderboard', { event_id: eventId });
  return { data, error };
};

// Real-time subscriptions
export const subscribeToEvent = (eventId, callback) => {
  return supabase
    .channel(`event-${eventId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'bets',
        filter: `event_id=eq.${eventId}`
      }, 
      callback
    )
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'user_bets'
      }, 
      callback
    )
    .subscribe();
};