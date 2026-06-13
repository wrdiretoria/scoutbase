import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-check'

export async function POST(req: NextRequest) {
  const check = await verifyAdmin()
  if (!check.ok) return check.response

  const { atletaId } = await req.json()
  if (!atletaId) return NextResponse.json({ error: 'atletaId obrigatório' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('alunos').delete().eq('id', atletaId)

  if (error) return NextResponse.json({ error: 'Erro ao deletar atleta.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
