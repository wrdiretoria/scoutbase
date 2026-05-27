import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Verifica se o número já está em uso por QUALQUER usuário (atleta ou treinador)
async function numeroEmUso(admin: ReturnType<typeof createAdminClient>, num: string): Promise<boolean> {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .or(`athlete_id.eq.MC-${num},athlete_id.eq.TR-${num}`)
    .limit(1)
    .maybeSingle()
  return !!data
}

async function gerarTreinadorId(admin: ReturnType<typeof createAdminClient>): Promise<string> {
  for (let t = 0; t < 15; t++) {
    const num = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    if (!(await numeroEmUso(admin, num))) return `TR-${num}`
  }
  return `TR-${Date.now().toString().slice(-5)}`
}

export async function POST(req: Request) {
  try {
    const { userId, cpf, dataNascimento, nome, tipo, email } = await req.json() as {
      userId?: string
      cpf?: string
      dataNascimento?: string
      nome?: string
      tipo?: string
      email?: string
    }

    if (!userId || !cpf || !dataNascimento) {
      return NextResponse.json({ error: 'Dados ausentes.' }, { status: 400 })
    }

    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11 && digits.length !== 14) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
    }

    const hash = createHash('sha256').update(digits).digest('hex')

    const admin = createAdminClient()

    // Gera ID único para treinadores (TR-XXXXX), salvo em athlete_id
    let treinadorId: string | undefined
    if (tipo === 'treinador') {
      const { data: existente } = await admin.from('profiles').select('athlete_id').eq('id', userId).maybeSingle()
      treinadorId = existente?.athlete_id ?? await gerarTreinadorId(admin)
    }

    const { error } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          cpf_hash: hash,
          data_nascimento: dataNascimento,
          ...(nome        && { nome }),
          ...(email       && { email }),
          ...(treinadorId && { athlete_id: treinadorId }),
        },
        { onConflict: 'id' }
      )

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 409 })
      }
      console.error('[salvar-perfil]', error)
      return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, ...(treinadorId && { treinadorId }) })
  } catch (err) {
    console.error('[salvar-perfil] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
