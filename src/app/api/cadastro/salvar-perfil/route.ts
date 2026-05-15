import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

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

    // Upsert profile row — tipo fica só no user_metadata do Auth (não é coluna de profiles)
    const { error } = await admin
      .from('profiles')
      .upsert(
        {
          id: userId,
          cpf_hash: hash,
          data_nascimento: dataNascimento,
          ...(nome  && { nome }),
          ...(email && { email }),
        },
        { onConflict: 'id' }
      )

    if (error) {
      // Unique constraint violation on cpf_hash
      if (error.code === '23505') {
        return NextResponse.json({ error: 'CPF já cadastrado.' }, { status: 409 })
      }
      console.error('[salvar-perfil]', error)
      return NextResponse.json({ error: 'Erro ao salvar perfil.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[salvar-perfil] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
