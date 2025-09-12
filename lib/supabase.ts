import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          payment_username: string | null;
          payment_app: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          payment_username?: string | null;
          payment_app?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          payment_username?: string | null;
          payment_app?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          name: string;
          date: string;
          welcome_message: string | null;
          event_code: string;
          host_id: string;
          co_host_id: string | null;
          is_premium: boolean;
          is_closed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          welcome_message?: string | null;
          event_code: string;
          host_id: string;
          co_host_id?: string | null;
          is_premium?: boolean;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          welcome_message?: string | null;
          event_code?: string;
          host_id?: string;
          co_host_id?: string | null;
          is_premium?: boolean;
          is_closed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      bets: {
        Row: {
          id: string;
          event_id: string;
          question: string;
          options: string[];
          correct_option: number | null;
          is_settled: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          question: string;
          options: string[];
          correct_option?: number | null;
          is_settled?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          question?: string;
          options?: string[];
          correct_option?: number | null;
          is_settled?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      wagers: {
        Row: {
          id: string;
          bet_id: string;
          user_id: string;
          selected_option: number;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          bet_id: string;
          user_id: string;
          selected_option: number;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          bet_id?: string;
          user_id?: string;
          selected_option?: number;
          amount?: number;
          created_at?: string;
        };
      };
      event_participants: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
    };
  };
};