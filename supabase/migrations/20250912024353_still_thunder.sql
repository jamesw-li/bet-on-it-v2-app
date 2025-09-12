/*
  # Initial Schema for Bet On It App

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `payment_info` (text, optional - for Venmo, PayPal, etc.)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `events`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `welcome_message` (text, optional)
      - `event_code` (text, unique, 6 characters)
      - `host_id` (uuid, references profiles)
      - `status` (text, 'active' or 'closed')
      - `is_premium` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `user_id` (uuid, references profiles)
      - `role` (text, 'host', 'co_host', or 'participant')
      - `joined_at` (timestamp)

    - `bets`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events)
      - `question` (text)
      - `status` (text, 'active' or 'settled')
      - `winning_option_id` (uuid, optional, references bet_options)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `settled_at` (timestamp, optional)

    - `bet_options`
      - `id` (uuid, primary key)
      - `bet_id` (uuid, references bets)
      - `option_text` (text)
      - `created_at` (timestamp)

    - `user_bets`
      - `id` (uuid, primary key)
      - `bet_id` (uuid, references bets)
      - `user_id` (uuid, references profiles)
      - `bet_option_id` (uuid, references bet_options)
      - `amount` (integer, default 1)
      - `placed_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for event participants to view event data
    - Add policies for hosts to manage their events
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  payment_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  welcome_message text,
  event_code text UNIQUE NOT NULL,
  host_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'participant' CHECK (role IN ('host', 'co_host', 'participant')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'settled')),
  winning_option_id uuid,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  settled_at timestamptz
);

-- Create bet_options table
CREATE TABLE IF NOT EXISTS bet_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  option_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_bets table
CREATE TABLE IF NOT EXISTS user_bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  bet_option_id uuid REFERENCES bet_options(id) ON DELETE CASCADE NOT NULL,
  amount integer DEFAULT 1,
  placed_at timestamptz DEFAULT now(),
  UNIQUE(bet_id, user_id)
);

-- Add foreign key constraint for winning_option_id after bet_options table is created
ALTER TABLE bets ADD CONSTRAINT bets_winning_option_id_fkey 
  FOREIGN KEY (winning_option_id) REFERENCES bet_options(id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Users can view events they participate in"
  ON events FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT event_id FROM event_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update their events"
  ON events FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid());

-- Event participants policies
CREATE POLICY "Users can view participants of events they're in"
  ON event_participants FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM event_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Bets policies
CREATE POLICY "Users can view bets in events they participate in"
  ON bets FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM event_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Event hosts and co-hosts can create bets"
  ON bets FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    event_id IN (
      SELECT event_id FROM event_participants 
      WHERE user_id = auth.uid() 
      AND role IN ('host', 'co_host')
    )
  );

CREATE POLICY "Event hosts and co-hosts can update bets"
  ON bets FOR UPDATE
  TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM event_participants 
      WHERE user_id = auth.uid() 
      AND role IN ('host', 'co_host')
    )
  );

-- Bet options policies
CREATE POLICY "Users can view bet options for accessible bets"
  ON bet_options FOR SELECT
  TO authenticated
  USING (
    bet_id IN (
      SELECT b.id FROM bets b
      JOIN event_participants ep ON b.event_id = ep.event_id
      WHERE ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Event hosts and co-hosts can create bet options"
  ON bet_options FOR INSERT
  TO authenticated
  WITH CHECK (
    bet_id IN (
      SELECT b.id FROM bets b
      JOIN event_participants ep ON b.event_id = ep.event_id
      WHERE ep.user_id = auth.uid() 
      AND ep.role IN ('host', 'co_host')
    )
  );

-- User bets policies
CREATE POLICY "Users can view user bets for accessible bets"
  ON user_bets FOR SELECT
  TO authenticated
  USING (
    bet_id IN (
      SELECT b.id FROM bets b
      JOIN event_participants ep ON b.event_id = ep.event_id
      WHERE ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can place their own bets"
  ON user_bets FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    bet_id IN (
      SELECT b.id FROM bets b
      JOIN event_participants ep ON b.event_id = ep.event_id
      WHERE ep.user_id = auth.uid()
    )
  );

-- Create function to get event leaderboard
CREATE OR REPLACE FUNCTION get_event_leaderboard(event_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  full_name text,
  total_winnings integer,
  total_bets integer,
  win_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.username,
    p.full_name,
    COALESCE(SUM(
      CASE 
        WHEN b.winning_option_id = ub.bet_option_id THEN ub.amount
        ELSE 0
      END
    ), 0)::integer as total_winnings,
    COUNT(ub.id)::integer as total_bets,
    CASE 
      WHEN COUNT(ub.id) > 0 THEN
        ROUND(
          (SUM(
            CASE 
              WHEN b.winning_option_id = ub.bet_option_id THEN 1
              ELSE 0
            END
          )::numeric / COUNT(ub.id)::numeric) * 100, 
          2
        )
      ELSE 0
    END as win_rate
  FROM profiles p
  JOIN event_participants ep ON p.id = ep.user_id
  LEFT JOIN user_bets ub ON p.id = ub.user_id
  LEFT JOIN bets b ON ub.bet_id = b.id AND b.event_id = event_id
  WHERE ep.event_id = event_id
  GROUP BY p.id, p.username, p.full_name
  ORDER BY total_winnings DESC, win_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();