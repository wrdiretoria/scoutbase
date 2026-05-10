import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

async function gerarAthleteId(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    const id = `MC-${num}`
    const { data } = await admin.from('profiles').select('id').eq('athlete_id', id).maybeSingle()
    if (!data) return id
  }
  return `MC-${Date.now().toString().slice(-5)}`
}

export async function POST(req: Request) {
  try {
    const { userId, dataNascimento, nome, escolaId, athleteId: preGeneratedId, recoveryEmail, avatarUrl } = await req.json() as {
      userId?: string
      dataNascimento?: string
      nome?: string
      escolaId?: string
      athleteId?: string
      recoveryEmail?: string | null
      avatarUrl?: string | null
    }

    if (!userId || !dataNascimento) {
      return NextResponse.json({ error: 'Dados ausentes.' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Usa o ID pré-gerado se vier do cadastro, senão busca ou gera um novo
    const { data: existente } = await admin
      .from('profiles')
      .select('athlete_id')
      .eq('id', userId)
      .maybeSingle()

    const athleteId = existente?.athlete_id ?? preGeneratedId ?? await gerarAthleteId(admin)

    const { error } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          data_nascimento: dataNascimento,
          athlete_id: athleteId,
          tipo: 'atleta',
          ...(nome          && { nome }),
          ...(escolaId      && { escola_id: escolaId }),
          ...(recoveryEmail && { recovery_email: recoveryEmail }),
          ...(avatarUrl     && { avatar_url: avatarUrl }),
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
