import { createServerClient, createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  // 1. Verify session
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const mesAno = new Date().toISOString().slice(0, 7) // 'YYYY-MM'
  const admin = createAdminClient()

  // 2. Fetch current count for this month
  const { data: existing } = await admin
    .from('uso_trial')
    .select('id, avaliacoes_usadas')
    .eq('professor_id', user.id)
    .eq('mes_ano', mesAno)
    .maybeSingle()

  if (existing) {
    // Increment
    await admin
      .from('uso_trial')
      .update({ avaliacoes_usadas: existing.avaliacoes_usadas + 1 })
      .eq('id', existing.id)
  } else {
    // First evaluation this month
    await admin
      .from('uso_trial')
      .insert({ professor_id: user.id, mes_ano: mesAno, avaliacoes_usadas: 1 })
  }

  return NextResponse.json({ ok: true })
}
