/**
 * POST /api/auth/signin-por-id
 * Recebe { athleteId, password } → faz login server-side sem expor o email ao browser
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Os IDs são sequenciais (MC-00001…), então sem limite dá pra testar senhas à vontade.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!await checkRateLimit(`signin-id:ip:${ip}`, 30)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const { athleteId, password } = await req.json() as {
    athleteId?: string
    password?: string
  }

  if (!athleteId || !password) {
    return NextResponse.json({ error: 'Dados obrigatórios.' }, { status: 400 })
  }

  const prefix = athleteId.startsWith('TR-') ? 'TR' : 'MC'
  const idFormatado = `${prefix}-${athleteId.replace(/\D/g, '').padStart(5, '0')}`

  if (!/^(MC|TR)-\d{5}$/.test(idFormatado)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  if (!await checkRateLimit(`signin-id:id:${idFormatado}`, 10)) {
    return NextResponse.json({ error: 'Muitas tentativas para este ID. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('email')
    .eq('athlete_id', idFormatado)
    .single()

  if (error || !data?.email) {
    return NextResponse.json({ error: 'ID não encontrado.' }, { status: 404 })
  }

  // Faz o login server-side para nunca expor o email ao cliente
  const supabase = await createServerClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: data.email,
    password,
  })

  if (signInErr) {
    return NextResponse.json({ error: 'Credenciais incorretas.' }, { status: 401 })
  }

  const { data: { user: loggedUser } } = await supabase.auth.getUser()
  const tipo = (loggedUser?.user_metadata as { tipo?: string })?.tipo ?? ''

  return NextResponse.json({ ok: true, tipo })
}
