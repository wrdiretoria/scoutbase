/**
 * getOrCreateConversation — encontra a conversa 1:1 já existente entre dois
 * usuários ou cria uma nova (conversations + as duas linhas em
 * conversation_participants). Só cria conversas de 2 participantes — não há
 * nada no app que crie grupos, então a interseção de conversation_ids entre
 * os dois usuários já basta pra achar a conversa certa.
 *
 * Usa admin client: criar a conversa e inserir a linha do OUTRO participante
 * (que não é quem está chamando) exige bypassar RLS.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getOrCreateConversation(
  admin: SupabaseClient,
  userIdA: string,
  userIdB: string,
): Promise<string> {
  const [{ data: convsA }, { data: convsB }] = await Promise.all([
    admin.from('conversation_participants').select('conversation_id').eq('user_id', userIdA),
    admin.from('conversation_participants').select('conversation_id').eq('user_id', userIdB),
  ])

  const idsA = new Set((convsA ?? []).map(c => c.conversation_id as string))
  const existente = (convsB ?? []).find(c => idsA.has(c.conversation_id as string))
  if (existente) return existente.conversation_id as string

  const { data: conversa, error } = await admin
    .from('conversations')
    .insert({})
    .select('id')
    .single()

  if (error || !conversa) throw error ?? new Error('Erro ao criar conversa.')

  const { error: partErr } = await admin.from('conversation_participants').insert([
    { conversation_id: conversa.id, user_id: userIdA },
    { conversation_id: conversa.id, user_id: userIdB },
  ])
  if (partErr) throw partErr

  return conversa.id as string
}
