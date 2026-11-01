import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/pais/verificar
 * Verifica se um scout_id existe (admin client — sem RLS).
 * Body: { scout_id: string }
 * Retorna: { ok: true } | 404
 *
 * O SID é sequencial: não devolve id nem nome do atleta (antes dava para
 * listar o nome de todas as crianças) e tem limite de tentativas.
 * O primeiro acesso dos responsáveis agora usa /api/pais/primeiro-acesso.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!await checkRateLimit(`pais-verificar:ip:${ip}`, 10)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const { scout_id } = await req.json().catch(() => ({})) as { scout_id?: string }

  if (!scout_id) {
    return NextResponse.json({ error: 'scout_id obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: aluno, error } = await admin
    .from('alunos')
    .select('id')
    .eq('scout_id', scout_id.toUpperCase())
    .single()

  if (error || !aluno) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
