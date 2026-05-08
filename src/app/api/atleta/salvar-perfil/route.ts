import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { userId, dataNascimento } = await req.json() as {
      userId?: string
      dataNascimento?: string
    }

    if (!userId || !dataNascimento) {
      return NextResponse.json({ error: 'Dados ausentes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('profiles')
      .upsert(
        { id: userId, data_nascimento: dataNascimento },
        { onConflict: 'id' }
      )

    if (error) {
      console.error('[atleta/salvar-perfil]', error)
      return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[atleta/salvar-perfil] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
