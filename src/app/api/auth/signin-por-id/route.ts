/**
 * POST /api/auth/signin-por-id
 * Recebe { athleteId, password } → faz login server-side sem expor o email ao browser
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
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
