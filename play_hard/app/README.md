# Play Hard - MVP Implementation

A Progressive Web App for organizing, discovering, and joining pickup sports games.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Backend**: Supabase (auth, PostgreSQL database, real-time)
- **PWA**: next-pwa

## Prerequisites

- Node.js 20.9.0 or higher
- npm or yarn
- Supabase account (free tier works)

## Setup Instructions

### 1. Install Dependencies

```bash
cd app
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Project Settings > API
3. Copy your project URL and anon key

### 3. Configure Environment Variables

Create `.env.local` in the `app` directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Set Up Database Schema

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run the SQL from `supabase/schema.sql`

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### 6. Build for Production

```bash
npm run build
npm start
```

## Features Implemented

### Authentication
- User registration with email/password
- User login
- Profile management
- Session management via Supabase Auth

### Events
- Create pickup sports events
- Search and filter events by:
  - Sport type (basketball, soccer, football, etc.)
  - Skill level (beginner, intermediate, advanced, all welcome)
  - Location
  - Date/time
- Event details page with:
  - Participant list
  - Organizer information
  - Join/leave functionality
  - Event cancellation (for organizers)

### User Profiles
- Editable profile with:
  - Full name
  - Username
  - Bio
- View organized events
- View joined events
- Sign out functionality

### PWA Features
- Installable on mobile devices
- Offline support (via service worker)
- App shortcuts for quick access

## Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── events/          # Events pages
│   │   │   ├── create/      # Event creation form
│   │   │   ├── [id]/        # Event details
│   │   │   └── page.tsx     # Events list
│   │   ├── profile/         # User profile page
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home (redirects based on auth)
│   ├── components/ui/       # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/        # Supabase client configuration
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── utils.ts         # Utility functions
│   └── middleware.ts        # Next.js middleware for auth
├── public/
│   └── manifest.json        # PWA manifest
├── supabase/
│   └── schema.sql           # Database schema
└── package.json
```

## Database Schema

### Tables
- `profiles` - User profiles
- `sport_preferences` - User sport preferences
- `events` - Sports events
- `event_participants` - Event participants
- `event_bookmarks` - Bookmarked events
- `user_ratings` - User ratings and reviews

### Key Features
- Row Level Security (RLS) enabled on all tables
- Geospatial indexing for location-based queries
- Automatic `updated_at` timestamps

## Future Enhancements

### Map View
- Integrate Mapbox or Google Maps
- Show events on an interactive map
- Location picker for event creation

### Real-time Updates
- Live participant count
- Instant notifications for event changes

### Messaging
- In-app messaging between participants
- Event announcements

### Additional Features
- Event reminders via push notifications
- Calendar integration
- Equipment rental/sharing
- League and tournament organization

## Environment Notes

- The app requires Node.js 20.9.0+ for the Next.js 16 build system
- TypeScript is enabled for type safety
- Tailwind CSS v4 is used for styling

## License

MIT
