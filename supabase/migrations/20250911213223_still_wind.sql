/*
  # Initial Schema for Bet On It App

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique, not null)
      - `full_name` (text, nullable)
      - `avatar_url` (text, nullable)
      - `payment_username` (text, nullable)
      - `payment_app` (text, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `events`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `date` (text, not null)
      - `welcome_message` (text, nullable)
      - `event_code` (text, unique, not null)
      - `host_id` (uuid, references profiles)
      - `co_host_id` (uuid, references profiles, nullable)
      - `is_premium` (boolean, default false)
      - `is_closed` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `bets`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `question` (text, not null)
      - `options` (text array, not null)
      - `correct_option` (integer, nullable)
      - `is_settled` (boolean, default false)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `wagers`
      - `id` (uuid, primary key)
      - `bet_id` (uuid, references bets)
      - `user_id` (uuid, references profiles)
      - `selected_option` (integer, not null)
      - `amount` (numeric, not null, default 10)
      - `created_at` (timestamp)
    
    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references profiles)
      - `joined_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for event participants to view event data
    - Add policies for hosts to manage their events
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  payment_username text,
  payment_app text DEFAULT 'Venmo',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date text NOT NULL,
  welcome_message text,
  event_code text UNIQUE NOT NULL,
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  co_host_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_premium boolean DEFAULT false,
  is_closed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options text[] NOT NULL,
  correct_option integer,
  is_settled boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wagers table
CREATE TABLE IF NOT EXISTS wagers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  selected_option integer NOT NULL,
  amount numeric DEFAULT 10 NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bet_id, user_id)
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wagers ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Users can read events they participate in"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    host_id = auth.uid() OR
    co_host_id = auth.uid() OR
    id IN (
      SELECT event_id FROM event_participants WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid() OR co_host_id = auth.uid());

-- Bets policies
CREATE POLICY "Users can read bets for events they participate in"
  ON bets
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE 
        host_id = auth.uid() OR 
        co_host_id = auth.uid() OR
        id IN (SELECT event_id FROM event_participants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Event hosts can create bets"
  ON bets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM events WHERE host_id = auth.uid() OR co_host_id = auth.uid()
    )
  );

CREATE POLICY "Event hosts can update bets"
  ON bets
  FOR UPDATE
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE host_id = auth.uid() OR co_host_id = auth.uid()
    )
  );

-- Wagers policies
CREATE POLICY "Users can read wagers for events they participate in"
  ON wagers
  FOR SELECT
  TO authenticated
  USING (
    bet_id IN (
      SELECT id FROM bets WHERE event_id IN (
        SELECT id FROM events WHERE 
          host_id = auth.uid() OR 
          co_host_id = auth.uid() OR
          id IN (SELECT event_id FROM event_participants WHERE user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can create their own wagers"
  ON wagers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    bet_id IN (
      SELECT id FROM bets WHERE event_id IN (
        SELECT event_id FROM event_participants WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own wagers"
  ON wagers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Event participants policies
CREATE POLICY "Users can read participants for events they participate in"
  ON event_participants
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events WHERE 
        host_id = auth.uid() OR 
        co_host_id = auth.uid() OR
        id IN (SELECT event_id FROM event_participants WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can join events"
  ON event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_host_id ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_event_code ON events(event_code);
CREATE INDEX IF NOT EXISTS idx_bets_event_id ON bets(event_id);
CREATE INDEX IF NOT EXISTS idx_wagers_bet_id ON wagers(bet_id);
CREATE INDEX IF NOT EXISTS idx_wagers_user_id ON wagers(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER bets_updated_at
  BEFORE UPDATE ON bets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();