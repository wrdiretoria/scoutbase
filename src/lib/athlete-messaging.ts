import { erroDataNascimento } from '@/lib/categoria'
import type { createAdminClient } from '@/lib/supabase'

export function atletaMaiorDeIdade(data: string | null | undefined, hoje = new Date()): boolean {
  const nascimento = data?.slice(0, 10)
  if (!nascimento || erroDataNascimento(nascimento, hoje)) return false
  const [ano, mes, dia] = nascimento.split('-').map(Number)
  return hoje >= new Date(ano + 18, mes - 1, dia)
}

export async function podeTrocarMensagens(admin: ReturnType<typeof createAdminClient>, ids: string[]) {
  const allowed = await Promise.all(ids.map(async id => {
    const { data: { user }, error } = await admin.auth.admin.getUserById(id)
    if (error || !user) return false
    if (user.user_metadata?.tipo !== 'atleta') return true
    const { data: profile, error: profileError } = await admin.from('profiles')
      .select('data_nascimento').eq('id', id).maybeSingle()
    return !profileError && atletaMaiorDeIdade(profile?.data_nascimento)
  }))
  return allowed.every(Boolean)
}
