import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// --- TEMPORARY DEBUGGING ---
// Replace the placeholders below with your actual Supabase credentials.
const supabaseUrl = "YOUR_SUPABASE_URL_HERE";
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY_HERE";
// -------------------------

if (!supabaseUrl || supabaseUrl.includes("YOUR_SUPABASE_URL_HERE")) {
  throw new Error("CRITICAL ERROR: Please replace the placeholder in src/config/supabase.js with your actual Supabase URL.");
}

if (!supabaseAnonKey || supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY_HERE")) {
  throw new Error("CRITICAL ERROR: Please replace the placeholder in src/config/supabase.js with your actual Supabase Anon Key.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);