/**
 * IDs de perfis que compõem a "rede" de um usuário: conexões aceitas (nos dois
 * sentidos) + quem ele segue + ele mesmo. Usado para montar o feed da rede.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getNetworkIds(admin: SupabaseClient, userId: string): Promise<string[]> {
  const [{ data: conexoes }, { data: follows }] = await Promise.all([
    admin.from('connections')
      .select('requester_id, addressee_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
    admin.from('follows')
      .select('followee_id')
      .eq('follower_id', userId),
  ])

  const ids = new Set<string>([userId])
  for (const c of conexoes ?? []) {
    ids.add(c.requester_id === userId ? c.addressee_id : c.requester_id)
  }
  for (const f of follows ?? []) {
    ids.add(f.followee_id)
  }
  return Array.from(ids)
}
