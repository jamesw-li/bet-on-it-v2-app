import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// --- TEMPORARY DEBUGGING ---
// Replace the placeholders below with your actual Supabase credentials.
const supabaseUrl = "https://bsrpghzfffoveujelfkb.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcnBnaHpmZmZvdmV1amVsZmtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MTgwMTksImV4cCI6MjA3MzE5NDAxOX0.ahlXNx84-mOpw7u6-ISv5vCDmnycLHIK2p5WfI49iK8";
// -------------------------

if (!supabaseUrl || supabaseUrl.includes("YOUR_SUPABASE_URL_HERE")) {
  throw new Error("CRITICAL ERROR: Please replace the placeholder in src/config/supabase.js with your actual Supabase URL.");
}

if (!supabaseAnonKey || supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY_HERE")) {
  throw new Error("CRITICAL ERROR: Please replace the placeholder in src/config/supabase.js with your actual Supabase Anon Key.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);