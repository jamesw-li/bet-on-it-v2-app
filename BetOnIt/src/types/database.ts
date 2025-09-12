export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  payment_username?: string;
  payment_app?: 'venmo' | 'paypal' | 'cashapp';
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  event_code: string;
  creator_id: string;
  co_host_id?: string;
  is_premium: boolean;
  is_active: boolean;
  is_closed: boolean;
  max_guests: number;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  role: 'creator' | 'co_host' | 'participant';
  joined_at: string;
}

export interface Bet {
  id: string;
  event_id: string;
  title: string;
  description?: string;
  options: string[];
  creator_id: string;
  is_active: boolean;
  is_settled: boolean;
  winning_option?: number;
  settled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserBet {
  id: string;
  bet_id: string;
  user_id: string;
  selected_option: number;
  amount: number;
  created_at: string;
}

export interface BetTemplate {
  id: string;
  category: string;
  title: string;
  description?: string;
  options: string[];
  is_active: boolean;
}