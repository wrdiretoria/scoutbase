import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // 1. Verify that a trainer is authenticated
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { alunoId } = await req.json() as { alunoId: string }

  // 2. Get the athlete (must belong to this trainer)
  const { data: aluno, error: alunoErr } = await supabase
    .from('alunos')
    .select('id, scout_id, pai_auth_id')
    .eq('id', alunoId)
    .eq('professor_id', user.id)
    .single()

  if (alunoErr || !aluno || !aluno.scout_id) {
    return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })
  }

  if (!aluno.pai_auth_id) {
    return NextResponse.json(
      { error: 'Os pais ainda não criaram acesso para este atleta.' },
      { status: 404 }
    )
  }

  // 3. Reset to a random temporary password
  const senhaTemp = randomBytes(5).toString('hex') // 10 chars hex, unpredictable
  const admin = createAdminClient()
  const { error: updateErr } = await admin.auth.admin.updateUserById(aluno.pai_auth_id, {
    password: senhaTemp,
  })

  if (updateErr) {
    return NextResponse.json({ error: 'Erro ao resetar a senha.' }, { status: 500 })
  }

  return NextResponse.json({ senhaTemp })
}
