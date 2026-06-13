import { NextResponse } from 'next/server'
import { createServerClient } from './supabase'

type AdminCheckResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }

export async function verifyAdmin(): Promise<AdminCheckResult> {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  if (!ADMIN_EMAIL) {
    return { ok: false, response: NextResponse.json({ error: 'Não autorizado' }, { status: 403 }) }
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) {
    return { ok: false, response: NextResponse.json({ error: 'Não autorizado' }, { status: 403 }) }
  }

  return { ok: true, userId: user.id }
}
