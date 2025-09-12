/*
  # Initial Database Schema for Bet On It App

  1. New Tables
    - `users` - User profiles and account information
    - `events` - Betting events created by hosts
    - `event_participants` - Users participating in events
    - `bets` - Individual bets within events
    - `user_bets` - User wagers on specific bets
    - `bet_templates` - Pre-made bet templates for different event types

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Event creators can manage their events
    - Participants can view and interact with event data

  3. Features
    - User authentication and profiles
    - Event creation and management
    - Bet creation and participation
    - Payment app integration for settlements
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  payment_username text,
  payment_app text CHECK (payment_app IN ('venmo', 'paypal', 'cashapp')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  event_code text UNIQUE NOT NULL,
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  co_host_id uuid REFERENCES users(id) ON DELETE SET NULL,
  is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true,
  is_closed boolean DEFAULT false,
  max_guests integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text CHECK (role IN ('creator', 'co_host', 'participant')) DEFAULT 'participant',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  options jsonb NOT NULL DEFAULT '[]',
  creator_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true,
  is_settled boolean DEFAULT false,
  winning_option integer,
  settled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User bets table
CREATE TABLE IF NOT EXISTS user_bets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id uuid REFERENCES bets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  selected_option integer NOT NULL,
  amount numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(bet_id, user_id)
);

-- Bet templates table
CREATE TABLE IF NOT EXISTS bet_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  options jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_templates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Events policies
CREATE POLICY "Users can read events they participate in"
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
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Event creators can update their events"
  ON events FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id OR auth.uid() = co_host_id);

-- Event participants policies
CREATE POLICY "Users can read participants of events they're in"
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
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Event creators can manage participants"
  ON event_participants FOR ALL
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE creator_id = auth.uid() OR co_host_id = auth.uid()
    )
  );

-- Bets policies
CREATE POLICY "Users can read bets in events they participate in"
  ON bets FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT event_id FROM event_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Event creators and co-hosts can create bets"
  ON bets FOR INSERT
  TO authenticated
  WITH CHECK (
    event_id IN (
      SELECT id FROM events 
      WHERE creator_id = auth.uid() OR co_host_id = auth.uid()
    )
  );

CREATE POLICY "Event creators and co-hosts can update bets"
  ON bets FOR UPDATE
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE creator_id = auth.uid() OR co_host_id = auth.uid()
    )
  );

-- User bets policies
CREATE POLICY "Users can read user bets in events they participate in"
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
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bets"
  ON user_bets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Bet templates policies (public read access)
CREATE POLICY "Anyone can read bet templates"
  ON bet_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert some default bet templates
INSERT INTO bet_templates (category, title, description, options) VALUES
('game_night', 'Who will win the first game?', 'Predict the winner of the opening game', '["Player 1", "Player 2", "Player 3", "Player 4"]'),
('game_night', 'What will be the final score?', 'Guess the exact final score', '["0-10", "11-20", "21-30", "31+"]'),
('sports', 'Who will score first?', 'Predict which team/player scores first', '["Home Team", "Away Team"]'),
('sports', 'Total points scored', 'Predict the total points in the game', '["Under 200", "200-250", "Over 250"]'),
('party', 'Who will arrive last?', 'Guess who shows up fashionably late', '["Person A", "Person B", "Person C", "Someone else"]'),
('party', 'What time will the party really start?', 'When will things get going?', '["On time", "30 min late", "1 hour late", "2+ hours late"]');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_creator_id ON events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_event_code ON events(event_code);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_event_id ON bets(event_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_bet_id ON user_bets(bet_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_user_id ON user_bets(user_id);