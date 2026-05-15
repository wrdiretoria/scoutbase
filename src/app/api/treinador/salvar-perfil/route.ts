import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, bio, especialidade, cidade, avatarUrl } = await req.json() as {
      userId?: string
      bio?: string | null
      especialidade?: string | null
      cidade?: string | null
      avatarUrl?: string | null
    }

    if (!userId) return NextResponse.json({ error: 'userId ausente.' }, { status: 400 })

    const admin = createAdminClient()

    const payload: Record<string, unknown> = { id: userId }
    if (bio           !== undefined) payload.bio           = bio           || null
    if (especialidade !== undefined) payload.especialidade = especialidade || null
    if (cidade        !== undefined) payload.cidade        = cidade        || null
    if (avatarUrl     !== undefined) payload.avatar_url    = avatarUrl     || null

    const { error } = await admin.from('profiles').upsert(payload, { onConflict: 'id' })

    if (error) {
      console.error('[treinador/salvar-perfil]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[treinador/salvar-perfil] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
