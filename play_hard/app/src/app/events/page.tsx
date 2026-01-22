'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Event, SportType, SkillLevel } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

const SPORT_TYPES: { value: SportType; label: string }[] = [
  { value: 'basketball', label: 'Basketball' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'football', label: 'Football' },
  { value: 'baseball', label: 'Baseball' },
  { value: 'hockey', label: 'Hockey' },
  { value: 'volleyball', label: 'Volleyball' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'ultimate_frisbee', label: 'Ultimate Frisbee' },
  { value: 'kickball', label: 'Kickball' },
  { value: 'softball', label: 'Softball' },
  { value: 'tag', label: 'Tag' },
  { value: 'other', label: 'Other' },
]

const SKILL_LABELS: Record<SkillLevel, string> = {
  all_welcome: 'All Welcome',
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const getSkillColor = (level: SkillLevel): string => {
  switch (level) {
    case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'all_welcome': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
}

export default function EventsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSport, setFilterSport] = useState<SportType | 'all'>('all')
  const [filterSkill, setFilterSkill] = useState<SkillLevel | 'all'>('all')

  useEffect(() => {
    checkUser()
    loadEvents()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (!user) {
      router.push('/login')
    }
  }

  const loadEvents = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(full_name, avatar_url)
        `)
        .eq('is_cancelled', false)
        .gte('event_time', new Date().toISOString())
        .order('event_time', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
                         event.location_name?.toLowerCase().includes(search.toLowerCase())
    const matchesSport = filterSport === 'all' || event.sport_type === filterSport
    const matchesSkill = filterSkill === 'all' || event.skill_level === filterSkill
    return matchesSearch && matchesSport && matchesSkill
  })

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
        })

      if (error) throw error
      await loadEvents()
    } catch (err) {
      console.error('Error joining event:', err)
      alert('Failed to join event')
    }
  }

  const handleLeaveEvent = async (eventId: string) => {
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('event_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (error) throw error
      await loadEvents()
    } catch (err) {
      console.error('Error leaving event:', err)
      alert('Failed to leave event')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span className="text-emerald-600">Play</span> Hard
          </h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/events/create')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              + Create Event
            </Button>
            <Avatar className="cursor-pointer" onClick={() => router.push('/profile')}>
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                {user?.email?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Select value={filterSport} onValueChange={(v) => setFilterSport(v as SportType | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sports</SelectItem>
                  {SPORT_TYPES.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      {sport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filterSkill} onValueChange={(v) => setFilterSkill(v as SkillLevel | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by skill level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="all_welcome">All Welcome</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500 dark:text-gray-400">
                <p>No events found. Be the first to create one!</p>
              </CardContent>
            </Card>
          ) : (
            filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <span>{formatDate(event.event_time)}</span>
                        <span>•</span>
                        <span>{event.location_name}</span>
                      </CardDescription>
                    </div>
                    <Badge className={getSkillColor(event.skill_level)}>
                      {SKILL_LABELS[event.skill_level]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="capitalize">
                      {SPORT_TYPES.find(s => s.value === event.sport_type)?.label || event.sport_type}
                    </Badge>
                    {event.min_players && (
                      <Badge variant="outline">
                        {event.min_players}{event.max_players ? `-${event.max_players}` : '+'} players
                      </Badge>
                    )}
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Organized by {event.organizer?.full_name || 'Unknown'}
                  </div>
                  <Button
                    onClick={() => router.push(`/events/${event.id}`)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
