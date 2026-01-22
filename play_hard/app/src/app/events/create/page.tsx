'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SportType, SkillLevel } from '@/lib/types'

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

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'all_welcome', label: 'All Welcome' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export default function CreateEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sportType, setSportType] = useState<SportType>('basketball')
  const [locationName, setLocationName] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [minPlayers, setMinPlayers] = useState('2')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('all_welcome')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('You must be logged in to create an event')
      }

      // For MVP, using default San Francisco coordinates
      // In production, this would use the user's location or a map picker
      const location_lat = 37.7749
      const location_lng = -122.4194

      const { error: insertError } = await supabase
        .from('events')
        .insert({
          organizer_id: user.id,
          title,
          description: description || null,
          sport_type: sportType,
          location_lat,
          location_lng,
          location_name: locationName,
          location_address: locationAddress || null,
          event_time: new Date(eventTime).toISOString(),
          end_time: endTime ? new Date(endTime).toISOString() : null,
          min_players: parseInt(minPlayers) || 2,
          max_players: maxPlayers ? parseInt(maxPlayers) : null,
          skill_level: skillLevel,
          notes: notes || null,
        })

      if (insertError) throw insertError

      router.push('/events')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-2xl mx-auto pt-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400"
          >
            ← Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create a Pickup Game</CardTitle>
            <CardDescription>
              Set up a sports event and invite others to join
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Sport Type */}
              <div className="space-y-2">
                <Label htmlFor="sportType">Sport Type *</Label>
                <Select value={sportType} onValueChange={(v) => setSportType(v as SportType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORT_TYPES.map((sport) => (
                      <SelectItem key={sport.value} value={sport.value}>
                        {sport.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="e.g., Pickup Basketball at the Park"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell others about this game..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name *</Label>
                <Input
                  id="locationName"
                  type="text"
                  placeholder="e.g., Golden Gate Park Basketball Courts"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationAddress">Address (Optional)</Label>
                <Input
                  id="locationAddress"
                  type="text"
                  placeholder="e.g., 1000 Great Highway, San Francisco, CA"
                  value={locationAddress}
                  onChange={(e) => setLocationAddress(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500">
                  For MVP: Default San Francisco location used. Map picker coming soon.
                </p>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Start Time *</Label>
                  <Input
                    id="eventTime"
                    type="datetime-local"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (Optional)</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Player Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPlayers">Min Players</Label>
                  <Input
                    id="minPlayers"
                    type="number"
                    min="2"
                    value={minPlayers}
                    onChange={(e) => setMinPlayers(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPlayers">Max Players (Optional)</Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    min="2"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Skill Level */}
              <div className="space-y-2">
                <Label htmlFor="skillLevel">Skill Level</Label>
                <Select value={skillLevel} onValueChange={(v) => setSkillLevel(v as SkillLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Equipment needed, parking info, etc..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={loading}
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
