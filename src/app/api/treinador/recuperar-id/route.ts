/**
 * POST /api/treinador/recuperar-id
 *
 * Recebe { email } → devolve { treinadorId, nome } ou { ok: true } sem treinadorId.
 * Sempre retorna HTTP 200 para não confirmar se o email existe na base.
 * Rate limit: 5 tentativas por IP por hora.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const byIp = new Map<string, { count: number; resetAt: number }>()

function checkLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = byIp.get(ip)
  if (!entry || now > entry.resetAt) {
    byIp.set(ip, { count: 1, resetAt: now + 3_600_000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkLimit(ip)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const body = await req.json() as { email?: string }
  if (!body.email) {
    return NextResponse.json({ error: 'Email obrigatório.' }, { status: 400 })
  }

  const email = body.email.toLowerCase().trim()
  const admin = createAdminClient()

  // Busca na tabela profiles, filtrando apenas treinadores (TR-)
  const { data } = await admin
    .from('profiles')
    .select('athlete_id, nome')
    .eq('email', email)
    .like('athlete_id', 'TR-%')
    .limit(1)

  if (data && data.length > 0) {
    return NextResponse.json({ ok: true, treinadorId: data[0].athlete_id, nome: data[0].nome ?? '' })
  }

  // Fallback: tenta via auth (email pode não estar em profiles.email)
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const user = users?.users.find(u => u.email?.toLowerCase() === email)

  if (user) {
    const { data: prof } = await admin
      .from('profiles')
      .select('athlete_id, nome')
      .eq('id', user.id)
      .like('athlete_id', 'TR-%')
      .single()

    if (prof?.athlete_id) {
      return NextResponse.json({ ok: true, treinadorId: prof.athlete_id, nome: prof.nome ?? '' })
    }
  }

  // Sempre HTTP 200 — não confirma se email existe ou não
  return NextResponse.json({ ok: true })
}
