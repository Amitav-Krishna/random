-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE sport_type AS ENUM (
  'basketball', 'baseball', 'football', 'soccer',
  'hockey', 'volleyball', 'tennis', 'ultimate_frisbee',
  'kickball', 'softball', 'tag', 'other'
);

CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_welcome');

-- Users profile table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Sports preferences for users
CREATE TABLE public.sport_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_type sport_type NOT NULL,
  skill_level skill_level DEFAULT 'all_welcome',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, sport_type)
);

-- Events table
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sport_type sport_type NOT NULL,

  -- Location
  location_lat DECIMAL(10, 8) NOT NULL,
  location_lng DECIMAL(11, 8) NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT,

  -- Scheduling
  event_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,

  -- Player limits
  min_players INTEGER DEFAULT 2,
  max_players INTEGER,

  -- Other details
  skill_level skill_level DEFAULT 'all_welcome',
  notes TEXT,

  -- Status
  is_cancelled BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Event participants
CREATE TABLE public.event_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  left_at TIMESTAMP WITH TIME ZONE,
  is_organizer BOOLEAN DEFAULT FALSE,
  UNIQUE(event_id, user_id)
);

-- Event bookmarks/saved events
CREATE TABLE public.event_bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- User ratings/reviews
CREATE TABLE public.user_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rater_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(rater_id, rated_user_id, event_id)
);

-- Create indexes for performance
CREATE INDEX idx_events_location ON public.events USING GIST(
  ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)::geography
);
CREATE INDEX idx_events_sport_type ON public.events(sport_type);
CREATE INDEX idx_events_event_time ON public.events(event_time);
CREATE INDEX idx_events_organizer ON public.events(organizer_id);
CREATE INDEX idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user ON public.event_participants(user_id);
CREATE INDEX idx_event_bookmarks_user ON public.event_bookmarks(user_id);
CREATE INDEX idx_profiles_location ON public.profiles USING GIST(
  ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)::geography
);

-- Row Level Security (RLS) policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Sport preferences policies
CREATE POLICY "Users can view own preferences" ON public.sport_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.sport_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own events" ON public.events
  FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can cancel own events" ON public.events
  FOR DELETE USING (auth.uid() = organizer_id);

-- Event participants policies
CREATE POLICY "Anyone can view event participants" ON public.event_participants
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can join events" ON public.event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave own participation" ON public.event_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Organizers can remove participants" ON public.event_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_participants.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Event bookmarks policies
CREATE POLICY "Users can view own bookmarks" ON public.event_bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks" ON public.event_bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- User ratings policies
CREATE POLICY "Anyone can view ratings" ON public.user_ratings
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create ratings" ON public.user_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Functions for updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_events
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Function to get current participant count for an event
CREATE OR REPLACE FUNCTION public.get_event_participant_count(event_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)
  FROM public.event_participants
  WHERE event_participants.event_id = $1
  AND left_at IS NULL;
$$ LANGUAGE SQL STABLE;

-- Function to check if user is in an event
CREATE OR REPLACE FUNCTION public.is_user_in_event(event_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_participants
    WHERE event_participants.event_id = $1
    AND event_participants.user_id = $2
    AND left_at IS NULL
  );
$$ LANGUAGE SQL STABLE;
