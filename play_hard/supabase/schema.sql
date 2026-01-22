-- Play Hard Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  location_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sport_type TEXT NOT NULL CHECK (sport_type IN (
    'basketball', 'baseball', 'football', 'soccer', 'hockey',
    'volleyball', 'tennis', 'ultimate_frisbee', 'kickball', 'softball', 'tag', 'other'
  )),
  location_lat FLOAT NOT NULL,
  location_lng FLOAT NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT,
  event_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  min_players INTEGER DEFAULT 2,
  max_players INTEGER,
  skill_level TEXT NOT NULL DEFAULT 'all_welcome' CHECK (skill_level IN (
    'beginner', 'intermediate', 'advanced', 'all_welcome'
  )),
  notes TEXT,
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create event_participants table
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_organizer BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

-- 4. Create sport_preferences table (optional, for future)
CREATE TABLE sport_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sport_type TEXT NOT NULL,
  skill_level TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create event_bookmarks table (optional, for future)
CREATE TABLE event_bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 6. Create user_ratings table (optional, for future)
CREATE TABLE user_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rater_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX events_event_time_idx ON events(event_time);
CREATE INDEX events_location_idx ON events(location_lat, location_lng);
CREATE INDEX events_sport_type_idx ON events(sport_type);
CREATE INDEX event_participants_event_id_idx ON event_participants(event_id);
CREATE INDEX event_participants_user_id_idx ON event_participants(user_id);
CREATE INDEX event_bookmarks_event_id_idx ON event_bookmarks(event_id);
CREATE INDEX event_bookmarks_user_id_idx ON event_bookmarks(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sport_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Profiles (users can read all, update own)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- RLS Policies: Events (read all, insert authenticated)
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update their events"
  ON events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete their events"
  ON events FOR DELETE USING (auth.uid() = organizer_id);

-- RLS Policies: Event participants
CREATE POLICY "Event participants are viewable by everyone"
  ON event_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join events"
  ON event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave events"
  ON event_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own participation"
  ON event_participants FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Sport preferences
CREATE POLICY "Users can manage own sport preferences"
  ON sport_preferences FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: Bookmarks
CREATE POLICY "Users can manage own bookmarks"
  ON event_bookmarks FOR ALL USING (auth.uid() = user_id);

-- RLS Policies: Ratings
CREATE POLICY "Ratings are viewable by everyone"
  ON user_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create ratings"
  ON user_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
