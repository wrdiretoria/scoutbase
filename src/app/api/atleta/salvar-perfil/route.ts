import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

async function gerarAthleteId(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const id = `MC-${num}`
    const { data } = await admin.from('profiles').select('id').eq('athlete_id', id).maybeSingle()
    if (!data) return id
  }
  // fallback: timestamp garante unicidade
  return `MC-${Date.now().toString().slice(-5)}`
}

export async function POST(req: Request) {
  try {
    const { userId, dataNascimento, nome, email, escolaId } = await req.json() as {
      userId?: string
      dataNascimento?: string
      nome?: string
      email?: string
      escolaId?: string
    }

    if (!userId || !dataNascimento) {
      return NextResponse.json({ error: 'Dados ausentes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Verifica se já tem athlete_id (evita gerar um novo em upsert)
    const { data: existente } = await admin
      .from('profiles')
      .select('athlete_id')
      .eq('id', userId)
      .maybeSingle()

    const athleteId = existente?.athlete_id ?? await gerarAthleteId(admin)

    const { error } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          data_nascimento: dataNascimento,
          athlete_id: athleteId,
          tipo: 'atleta',
          ...(nome     && { nome }),
          ...(email    && { email }),
          ...(escolaId && { escola_id: escolaId }),
        },
        { onConflict: 'id' }
      )

    if (error) {
      console.error('[atleta/salvar-perfil]', error)
      return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, athleteId })
  } catch (err) {
    console.error('[atleta/salvar-perfil] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
