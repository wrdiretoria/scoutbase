/**
 * POST /api/atleta/recuperar-senha
 * Verifica athleteId + recoveryEmail → atualiza a senha via admin
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

// Rate-limit: 5 tentativas por IP por hora
const attempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const { athleteId, recoveryEmail, novaSenha } = await req.json() as {
    athleteId?: string
    recoveryEmail?: string
    novaSenha?: string
  }

  if (!athleteId || !recoveryEmail || !novaSenha) {
    return NextResponse.json({ error: 'Dados incompletos.' }, { status: 400 })
  }

  if (novaSenha.length < 6) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Busca perfil pelo ID + email de recuperação
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id')
    .eq('athlete_id', athleteId.toUpperCase().trim())
    .eq('recovery_email', recoveryEmail.toLowerCase().trim())
    .maybeSingle()

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'ID ou email de recuperação incorretos.' }, { status: 404 })
  }

  // 2. Atualiza a senha via admin
  const { error: updateErr } = await admin.auth.admin.updateUserById(
    profile.id,
    { password: novaSenha }
  )

  if (updateErr) {
    console.error('[recuperar-senha]', updateErr)
    return NextResponse.json({ error: 'Não foi possível redefinir a senha.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
