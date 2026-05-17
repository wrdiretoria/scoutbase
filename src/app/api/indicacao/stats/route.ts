/**
 * GET /api/indicacao/stats
 * Retorna quantos usuários foram indicados pelo atleta autenticado.
 */
import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const admin = createAdminClient()

    // Conta usuários que têm referred_by = user.id
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })

    const count = users.filter(u =>
      u.user_metadata?.referred_by === user.id
    ).length

    return NextResponse.json({ count })
  } catch (err) {
    console.error('[indicacao/stats] unexpected', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
