'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface SharedProfile {
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<SharedProfile | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from('shared_profiles')
        .select('display_name, username, avatar_url')
        .eq('id', userId)
        .single()
      if (data) setProfile(data)
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user) fetchProfile(user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setLoading(false)
      if (u) fetchProfile(u.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, isLoggedIn: !!user, profile }
}
