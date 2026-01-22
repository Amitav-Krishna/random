// Database types matching the Supabase schema
export type SportType =
  | 'basketball'
  | 'baseball'
  | 'football'
  | 'soccer'
  | 'hockey'
  | 'volleyball'
  | 'tennis'
  | 'ultimate_frisbee'
  | 'kickball'
  | ' softball'
  | 'tag'
  | 'other'

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all_welcome'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  location_lat: number | null
  location_lng: number | null
  location_name: string | null
  created_at: string
  updated_at: string
}

export interface SportPreference {
  id: string
  user_id: string
  sport_type: SportType
  skill_level: SkillLevel
  created_at: string
}

export interface Event {
  id: string
  organizer_id: string
  title: string
  description: string | null
  sport_type: SportType
  location_lat: number
  location_lng: number
  location_name: string
  location_address: string | null
  event_time: string
  end_time: string | null
  min_players: number
  max_players: number | null
  skill_level: SkillLevel
  notes: string | null
  is_cancelled: boolean
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  // Optional joined fields
  organizer?: Profile
  participant_count?: number
  is_joined?: boolean
  is_bookmarked?: boolean
}

export interface EventParticipant {
  id: string
  event_id: string
  user_id: string
  joined_at: string
  left_at: string | null
  is_organizer: boolean
  user?: Profile
}

export interface EventBookmark {
  id: string
  event_id: string
  user_id: string
  created_at: string
  event?: Event
}

export interface UserRating {
  id: string
  rater_id: string
  rated_user_id: string
  event_id: string | null
  rating: number
  comment: string | null
  created_at: string
  rater?: Profile
  rated_user?: Profile
}

// Form types
export interface CreateEventInput {
  title: string
  description?: string
  sport_type: SportType
  location_lat: number
  location_lng: number
  location_name: string
  location_address?: string
  event_time: string
  end_time?: string
  min_players?: number
  max_players?: number
  skill_level?: SkillLevel
  notes?: string
}

export interface UpdateProfileInput {
  full_name?: string
  username?: string
  bio?: string
  location_lat?: number
  location_lng?: number
  location_name?: string
  avatar_url?: string
}

// Event filter options
export interface EventFilters {
  sport_type?: SportType[]
  skill_level?: SkillLevel[]
  start_date?: string
  end_date?: string
  min_distance?: number // in km
  max_distance?: number // in km
  search?: string
}
