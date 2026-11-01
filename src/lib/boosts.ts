/**
 * IDs de perfis com destaque ativo — usado pelo ranking e pela busca de scout
 * pra ordenar quem está impulsionado antes do critério padrão (OVR/etc).
 *
 * Fonte única de destaque: a tabela `profile_boosts`, gravada só pelo webhook
 * de pagamento (service role). Tanto "Promover perfil" (30 dias) quanto
 * "Impulsionar perfil" (7 dias) gravam aqui. O antigo `promovido_ate` em
 * user_metadata não é mais lido: o próprio usuário consegue editar
 * user_metadata pelo navegador, então ele permitia destaque sem pagar.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getBoostedProfileIds(admin: SupabaseClient): Promise<Set<string>> {
  const { data } = await admin
    .from('profile_boosts')
    .select('profile_id')
    .gt('expires_at', new Date().toISOString())
  return new Set((data ?? []).map(b => b.profile_id as string))
}
