'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function CoachVisit({ subjectId }: { subjectId: string }) {
  useEffect(() => {
    let active = true
    async function track() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!active || !user || user.id === subjectId) return
      const key = `coach-visit:${user.id}:${subjectId}`
      try {
        if (sessionStorage.getItem(key)) return
        sessionStorage.setItem(key, '1')
        const { error } = await supabase.from('profile_views').insert({ subject_id: subjectId, viewer_id: user.id })
        if (error) sessionStorage.removeItem(key)
      } catch {
        // A tracking failure should never interrupt the public profile.
      }
    }
    void track()
    return () => { active = false }
  }, [subjectId])
  return null
}
