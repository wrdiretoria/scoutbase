import { createAdminClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const { athleteUserId } = await req.json() as { athleteUserId?: string }
    if (!athleteUserId || !UUID_RE.test(athleteUserId)) return NextResponse.json({ ok: false })

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!await checkRateLimit(`visita:${ip}:${athleteUserId}`, 3, 300_000)) {
      return NextResponse.json({ ok: false })
    }

    const admin = createAdminClient()
    await admin.from('visitas').insert({ atleta_id: athleteUserId })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[visita]', err)
    return NextResponse.json({ ok: false })
  }
}
