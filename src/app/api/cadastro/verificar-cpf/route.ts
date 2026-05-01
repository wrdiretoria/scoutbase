import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { cpf } = await req.json() as { cpf?: string }

    if (!cpf || typeof cpf !== 'string') {
      return NextResponse.json({ error: 'CPF ausente.' }, { status: 400 })
    }

    const digits = cpf.replace(/\D/g, '')
    if (digits.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
    }

    const hash = createHash('sha256').update(digits).digest('hex')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('cpf_hash', hash)
      .maybeSingle()

    if (error) {
      console.error('[verificar-cpf]', error)
      return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
    }

    if (data) {
      return NextResponse.json({ disponivel: false }, { status: 200 })
    }

    return NextResponse.json({ disponivel: true }, { status: 200 })
  } catch (err) {
    console.error('[verificar-cpf] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
