/**
 * IDs de perfis com destaque ativo — usado pelo ranking e pela busca de scout
 * pra ordenar quem está impulsionado antes do critério padrão (OVR/etc).
 *
 * Existem dois mecanismos de boost neste app: o legado `promovido_ate` em
 * user_metadata (feature "Promover perfil" de 30 dias, já em produção) e a
 * nova tabela `profile_boosts` (add-on "Impulsionar perfil" de 7 dias, desta
 * fase). Um perfil conta como impulsionado se qualquer um dos dois estiver
 * ativo — dá pra checar o legado direto no objeto de usuário já carregado
 * (sem query extra); esta função só cobre o lado da tabela nova.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getBoostedProfileIds(admin: SupabaseClient): Promise<Set<string>> {
  const { data } = await admin
    .from('profile_boosts')
    .select('profile_id')
    .gt('expires_at', new Date().toISOString())
  return new Set((data ?? []).map(b => b.profile_id as string))
}
