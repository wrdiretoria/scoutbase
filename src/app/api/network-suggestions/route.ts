/**
 * GET /api/network-suggestions
 * "Pessoas que você pode conhecer": alguns perfis com quem o usuário logado
 * ainda não tem nenhuma conexão (pendente, aceita ou recusada), em qualquer direção.
 * Resposta: { suggestions: [{ id, nome, avatarUrl }] }
 */
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ suggestions: [] })

    const admin = createAdminClient()

    const { data: conexoes } = await admin
      .from('connections')
      .select('requester_id, addressee_id')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    const excluir = new Set<string>([user.id])
    for (const c of conexoes ?? []) {
      excluir.add(c.requester_id === user.id ? c.addressee_id : c.requester_id)
    }

    const { data: perfis, error } = await admin
      .from('profiles')
      .select('id, nome, avatar_url')
      .not('nome', 'is', null)
      .order('criado_em', { ascending: false })
      .limit(excluir.size + 10)

    if (error) {
      console.error('[network-suggestions] GET', error)
      return NextResponse.json({ suggestions: [] })
    }

    const sugestoes = (perfis ?? [])
      .filter(p => !excluir.has(p.id))
      .slice(0, 5)
      .map(p => ({ id: p.id, nome: p.nome, avatarUrl: p.avatar_url }))

    return NextResponse.json({ suggestions: sugestoes })
  } catch (err) {
    console.error('[network-suggestions] GET unexpected', err)
    return NextResponse.json({ suggestions: [] })
  }
}
