import { createAdminClient } from '@/lib/supabase'

/** Fail closed: only accounts on the server-managed approval list are trainers. */
export async function isVerifiedTrainer(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('verified_trainers')
    .select('approved')
    .eq('user_id', userId)
    .maybeSingle()

  return !error && data?.approved === true
}

