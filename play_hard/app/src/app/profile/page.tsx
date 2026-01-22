'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { Event, Profile, SportPreference } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([])
  const [sportPreferences, setSportPreferences] = useState<SportPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editBio, setEditBio] = useState('')

  useEffect(() => {
    checkUser()
    loadData()
  }, [])

  const checkUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (!user) {
      router.push('/auth/login')
    }
  }

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      setEditFullName(profileData?.full_name || '')
      setEditUsername(profileData?.username || '')
      setEditBio(profileData?.bio || '')

      // Load events I'm organizing
      const { data: organizedData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)
        .gte('event_time', new Date().toISOString())
        .order('event_time', { ascending: true })

      setMyEvents(organizedData || [])

      // Load events I've joined
      const { data: participatedData } = await supabase
        .from('event_participants')
        .select(`
          event_id,
          events!inner(*)
        `)
        .eq('user_id', user.id)
        .is('left_at', null)

      setJoinedEvents(participatedData?.map((p: any) => p.events).filter((e: Event) => new Date(e.event_time) >= new Date()) || [])

      // Load sport preferences
      const { data: prefsData } = await supabase
        .from('sport_preferences')
        .select('*')
        .eq('user_id', user.id)

      setSportPreferences(prefsData || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editFullName,
          username: editUsername,
          bio: editBio,
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile((prev) => prev ? {
        ...prev,
        full_name: editFullName,
        username: editUsername,
        bio: editBio,
      } : null)
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving profile:', err)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            <span className="text-emerald-600">Play</span> Hard
          </h1>
          <Button
            onClick={() => router.push('/events')}
            variant="outline"
          >
            Back to Events
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                    {profile?.full_name?.[0] || profile?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">
                    {isEditing ? (
                      <Input
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="text-2xl font-bold"
                      />
                    ) : (
                      profile?.full_name || 'Your Name'
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span>@</span>
                        <Input
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder="username"
                          className="h-8"
                        />
                      </div>
                    ) : (
                      profile?.username ? `@${profile.username}` : profile?.email || ''
                    )}
                  </CardDescription>
                </div>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={() => setIsEditing(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {profile?.bio || 'No bio yet'}
                  </p>
                )}
              </div>

              {sportPreferences.length > 0 && (
                <div>
                  <Label>Sports Preferences</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sportPreferences.map((pref) => (
                      <Badge key={pref.id} variant="outline" className="capitalize">
                        {pref.sport_type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleSignOut}
                variant="outline"
                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Events */}
        <Tabs defaultValue="organized">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organized">
              Organized ({myEvents.length})
            </TabsTrigger>
            <TabsTrigger value="joined">
              Joined ({joinedEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organized" className="space-y-4 mt-4">
            {myEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500 dark:text-gray-400">
                  <p>You haven't created any events yet.</p>
                  <Button
                    onClick={() => router.push('/events/create')}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Create Your First Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myEvents.map((event) => (
                <Card
                  key={event.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{formatDate(event.event_time)}</CardDescription>
                      </div>
                      <Badge className="capitalize">{event.sport_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.location_name}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="joined" className="space-y-4 mt-4">
            {joinedEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500 dark:text-gray-400">
                  <p>You haven't joined any events yet.</p>
                  <Button
                    onClick={() => router.push('/events')}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Browse Events
                  </Button>
                </CardContent>
              </Card>
            ) : (
              joinedEvents.map((event) => (
                <Card
                  key={event.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{formatDate(event.event_time)}</CardDescription>
                      </div>
                      <Badge className="capitalize">{event.sport_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.location_name}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
