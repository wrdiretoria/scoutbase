import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { profile_id, tipo } = await req.json() as { profile_id?: string; tipo?: string }
    if (!profile_id || !tipo) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    // Pega o user autenticado via cookie de sessão (pode ser null em edge cases)
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      null
    const ua = req.headers.get('user-agent') ?? null

    const admin = createAdminClient()
    const { error } = await admin.from('aceite_termos').insert({
      user_id:    user?.id ?? null,
      profile_id,
      tipo,
      versao:     '1.0',
      ip,
      user_agent: ua,
    })

    if (error) {
      console.error('[aceite-termos] insert error:', error.message)
      // Não retorna erro pro client — log silencioso
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[aceite-termos]', err)
    return NextResponse.json({ ok: true }) // falha silenciosa
  }
}
