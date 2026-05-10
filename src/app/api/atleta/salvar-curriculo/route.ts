import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, bio, altura, peso, peDominante, clubeAtual } = await req.json() as {
      userId?: string
      bio?: string
      altura?: number | null
      peso?: number | null
      peDominante?: string
      clubeAtual?: string
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId ausente.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          ...(bio          !== undefined && { bio:          bio          || null }),
          ...(altura       !== undefined && { altura:       altura       || null }),
          ...(peso         !== undefined && { peso:         peso         || null }),
          ...(peDominante  !== undefined && { pe_dominante: peDominante  || null }),
          ...(clubeAtual   !== undefined && { clube_atual:  clubeAtual   || null }),
        },
        { onConflict: 'id' }
      )

    if (error) {
      console.error('[atleta/salvar-curriculo]', error)
      return NextResponse.json({ error: 'Erro ao salvar currículo.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[atleta/salvar-curriculo] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
