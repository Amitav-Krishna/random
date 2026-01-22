'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { Event, EventParticipant, SkillLevel } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

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

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [participants, setParticipants] = useState<EventParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [isOrganizer, setIsOrganizer] = useState(false)

  useEffect(() => {
    checkUser()
    loadEvent()
    loadParticipants()
  }, [eventId])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Check if user is a participant
    const { data: participantData } = await supabase
      .from('event_participants')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .is('left_at', null)
      .single()

    setIsJoined(!!participantData)
  }

  const loadEvent = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(*)
        `)
        .eq('id', eventId)
        .single()

      if (error) throw error
      setEvent(data)

      // Check if current user is organizer
      const { data: { user } } = await supabase.auth.getUser()
      if (user && data.organizer_id === user.id) {
        setIsOrganizer(true)
      }
    } catch (err) {
      console.error('Error loading event:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadParticipants = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('event_id', eventId)
        .is('left_at', null)

      if (error) throw error
      setParticipants(data || [])
    } catch (err) {
      console.error('Error loading participants:', err)
    }
  }

  const handleJoin = async () => {
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
      setIsJoined(true)
      await loadParticipants()
    } catch (err) {
      console.error('Error joining event:', err)
      alert('Failed to join event')
    }
  }

  const handleLeave = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('event_participants')
        .update({ left_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('user_id', user.id)

      if (error) throw error
      setIsJoined(false)
      await loadParticipants()
    } catch (err) {
      console.error('Error leaving event:', err)
      alert('Failed to leave event')
    }
  }

  const handleCancelEvent = async () => {
    if (!user || !isOrganizer) return

    const reason = prompt('Cancellation reason (optional):')

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('events')
        .update({
          is_cancelled: true,
          cancellation_reason: reason || null,
        })
        .eq('id', eventId)

      if (error) throw error
      router.push('/events')
    } catch (err) {
      console.error('Error cancelling event:', err)
      alert('Failed to cancel event')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Event not found</p>
            <Button onClick={() => router.push('/events')} className="mt-4">
              Back to Events
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const participantCount = participants.length
  const canJoin = !isJoined && !isOrganizer &&
                  (!event.max_players || participantCount < event.max_players)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400"
          >
            ← Back
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="cursor-pointer" onClick={() => router.push('/profile')}>
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                {user?.email?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {event.is_cancelled && (
          <Card className="mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <p className="text-red-600 dark:text-red-400 font-semibold">
                This event has been cancelled
                {event.cancellation_reason && `: ${event.cancellation_reason}`}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2 text-base">
                  <span>{formatDate(event.event_time)}</span>
                  {event.end_time && (
                    <>
                      <span>•</span>
                      <span>Ends {new Date(event.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    </>
                  )}
                </CardDescription>
              </div>
              <Badge className={getSkillColor(event.skill_level)}>
                {SKILL_LABELS[event.skill_level]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location */}
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-gray-700 dark:text-gray-300">{event.location_name}</p>
              {event.location_address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.location_address}</p>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="font-semibold mb-2">About this event</h3>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Sport Type */}
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="capitalize text-sm">
                {event.sport_type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-sm">
                {event.min_players}{event.max_players ? `-${event.max_players}` : '+'} players needed
              </Badge>
              <Badge variant="outline" className="text-sm">
                {participantCount} joined
              </Badge>
            </div>

            {/* Notes */}
            {event.notes && (
              <div>
                <h3 className="font-semibold mb-2">Additional Notes</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{event.notes}</p>
              </div>
            )}

            {/* Organizer */}
            <div>
              <h3 className="font-semibold mb-2">Organizer</h3>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {event.organizer?.full_name?.[0] || event.organizer?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{event.organizer?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{event.organizer?.email || ''}</p>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div>
              <h3 className="font-semibold mb-3">
                Participants ({participantCount})
              </h3>
              {participants.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No participants yet</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <Avatar>
                        <AvatarFallback>
                          {participant.user?.full_name?.[0] || participant.user?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{participant.user?.full_name || 'Unknown'}</p>
                        {participant.is_organizer && (
                          <Badge variant="outline" className="text-xs">Organizer</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {isOrganizer ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">Cancel Event</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel Event</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel this event? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => {}}>Close</Button>
                        <Button variant="destructive" onClick={handleCancelEvent}>
                          Yes, Cancel Event
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    onClick={() => router.push(`/events/${eventId}/edit`)}
                    variant="outline"
                  >
                    Edit Event
                  </Button>
                </>
              ) : isJoined ? (
                <Button
                  onClick={handleLeave}
                  variant="outline"
                  className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Leave Event
                </Button>
              ) : (
                <Button
                  onClick={handleJoin}
                  disabled={!canJoin}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {canJoin ? 'Join Event' : 'Event Full'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
