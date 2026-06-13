/**
 * POST /api/atleta/recuperar-id
 *
 * Modo 1 — por email de recuperação:
 *   { email } → lista de { athlete_id, nome } vinculados ao recovery_email
 *
 * Modo 2 — por nome + data de nascimento (fallback):
 *   { nome, dataNascimento } → lista de { athlete_id, nome }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!await checkRateLimit(`recuperar-id:ip:${ip}`, 5)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
  }


  const body = await req.json() as {
    email?: string
    nome?: string
    dataNascimento?: string
  }

  const admin = createAdminClient()

  // ── Modo 1: por email de recuperação ─────────────────────────
  if (body.email) {
    const { data, error } = await admin
      .from('profiles')
      .select('athlete_id, nome')
      .eq('recovery_email', body.email.toLowerCase().trim())
      .not('athlete_id', 'is', null)

    if (error) return NextResponse.json({ error: 'Erro ao buscar.' }, { status: 500 })

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum atleta encontrado com este email.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ atletas: data })
  }

  // ── Modo 2: por nome + data de nascimento ────────────────────
  if (body.nome && body.dataNascimento) {
    const nomeLimpo = body.nome.trim()
    if (nomeLimpo.length < 5) {
      return NextResponse.json({ error: 'Nome muito curto. Digite pelo menos 5 caracteres.' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('profiles')
      .select('athlete_id, nome')
      .ilike('nome', `${nomeLimpo}%`)
      .eq('data_nascimento', body.dataNascimento)
      .not('athlete_id', 'is', null)
      .limit(3)

    if (error) return NextResponse.json({ error: 'Erro ao buscar.' }, { status: 500 })

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum atleta encontrado com esse nome e data de nascimento.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ atletas: data })
  }

  return NextResponse.json(
    { error: 'Informe o email de recuperação ou o nome + data de nascimento.' },
    { status: 400 }
  )
}
