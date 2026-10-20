/**
 * GET /api/seguir
 * Lista os IDs de perfis que o usuário logado está seguindo.
 *
 * POST /api/seguir
 * Alterna seguir/deixar de seguir um perfil. Body: { followeeId }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ seguindo: [] })

    const { data } = await supabase.from('follows').select('followee_id').eq('follower_id', user.id)

    return NextResponse.json({ seguindo: (data ?? []).map(f => f.followee_id) })
  } catch {
    return NextResponse.json({ seguindo: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { followeeId } = await req.json() as { followeeId?: string }
    if (!followeeId?.trim()) {
      return NextResponse.json({ error: 'followeeId é obrigatório.' }, { status: 400 })
    }
    if (followeeId === user.id) {
      return NextResponse.json({ error: 'Você não pode seguir a si mesmo.' }, { status: 400 })
    }

    const { data: existente } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('followee_id', followeeId)
      .maybeSingle()

    if (existente) {
      const { error } = await supabase.from('follows').delete().eq('id', existente.id)
      if (error) {
        console.error('[seguir] unfollow', error)
        return NextResponse.json({ error: 'Erro ao deixar de seguir.' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, seguindo: false })
    }

    const { error } = await supabase.from('follows').insert({ follower_id: user.id, followee_id: followeeId })
    if (error) {
      console.error('[seguir] follow', error)
      return NextResponse.json({ error: 'Erro ao seguir.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, seguindo: true })
  } catch (err) {
    console.error('[seguir] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
