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

    // Usa o contador salvo no metadata (mais rápido que varrer todos os users)
    const count = (user.user_metadata?.indicacoes_count as number) ?? 0
    const faltam = 10 - (count % 10 === 0 && count > 0 ? 10 : count % 10)

    return NextResponse.json({
      count,
      faltam,               // quantas indicações faltam para o próximo card
      proximoCard: faltam,  // alias legível
    })
  } catch (err) {
    console.error('[indicacao/stats] unexpected', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
