/**
 * POST /api/atleta/recuperar-senha
 * Verifica athleteId + recoveryEmail → atualiza a senha via admin
 *
 * Rate limit duplo:
 *   - Por IP: 5 tentativas/hora (em memória — redefine no redeploy, limitação conhecida)
 *   - Por athleteId: 3 tentativas/hora (em memória — idem)
 * Para rate limit persistente, instale Upstash Redis (@upstash/ratelimit).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!await checkRateLimit(`recuperar-senha:ip:${ip}`, 5)) {
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

  const idFormatado = athleteId.trim().toUpperCase()
  if (!/^(MC|TR)-\d{5}$/.test(idFormatado)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 })
  }

  if (!await checkRateLimit(`recuperar-senha:id:${idFormatado}`, 3)) {
    return NextResponse.json({ error: 'Muitas tentativas para este ID. Tente novamente em 1 hora.' }, { status: 429 })
  }

  if (novaSenha.length < 8) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id')
    .eq('athlete_id', idFormatado)
    .eq('recovery_email', recoveryEmail.toLowerCase().trim())
    .maybeSingle()

  if (profileErr || !profile) {
    return NextResponse.json({ error: 'ID ou email de recuperação incorretos.' }, { status: 404 })
  }

  const { error: updateErr } = await admin.auth.admin.updateUserById(
    profile.id,
    { password: novaSenha }
  )

  if (updateErr) {
    console.error('[recuperar-senha] update error code:', updateErr.code)
    return NextResponse.json({ error: 'Não foi possível redefinir a senha.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
