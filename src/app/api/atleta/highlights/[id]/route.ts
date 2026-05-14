import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// ── DELETE — remove highlight (somente o dono) ────────────────────────────────

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    if (!id) return NextResponse.json({ error: 'ID ausente.' }, { status: 400 })

    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    // RLS já garante que só o dono pode deletar, mas validamos profile_id explicitamente
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id)
      .eq('profile_id', user.id)

    if (error) {
      console.error('[highlights DELETE]', error)
      return NextResponse.json({ error: 'Erro ao deletar highlight.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[highlights DELETE] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
