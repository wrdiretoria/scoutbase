import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

/**
 * POST /api/pais/verificar
 * Verifica se um scout_id existe (admin client — sem RLS).
 * Body: { scout_id: string }
 * Retorna: { id, nome } | 404
 */
export async function POST(req: NextRequest) {
  const { scout_id } = await req.json() as { scout_id: string }

  if (!scout_id) {
    return NextResponse.json({ error: 'scout_id obrigatório' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: aluno, error } = await admin
    .from('alunos')
    .select('id, nome, telefone')
    .eq('scout_id', scout_id.toUpperCase())
    .single()

  if (error || !aluno) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ id: aluno.id, nome: aluno.nome, telefone: aluno.telefone ?? null })
}
