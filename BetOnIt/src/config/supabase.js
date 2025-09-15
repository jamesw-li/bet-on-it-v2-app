import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto'; // Essential for Supabase to work in React Native

// Read the environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Throw a clear error if the variables are missing
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("CRITICAL ERROR: Supabase URL or Anon Key is not loaded. Check the .env file and server restart.");
}

// Initialize and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);