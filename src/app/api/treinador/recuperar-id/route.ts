/**
 * POST /api/treinador/recuperar-id
 *
 * Recebe { email } → devolve { treinadorId, nome } do treinador com aquele email
 * O ID do treinador fica em profiles.athlete_id com prefixo "TR-"
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string }

  if (!body.email) {
    return NextResponse.json({ error: 'Email obrigatório.' }, { status: 400 })
  }

  const email = body.email.toLowerCase().trim()
  const admin = createAdminClient()

  // Busca na tabela profiles pelo email, filtrando apenas contas de treinador (TR-)
  const { data, error } = await admin
    .from('profiles')
    .select('athlete_id, nome, email')
    .eq('email', email)
    .like('athlete_id', 'TR-%')
    .limit(5)

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar. Tente novamente.' }, { status: 500 })
  }

  // Se não achou pelo campo email direto, tenta pelo email no auth (Supabase Auth)
  if (!data || data.length === 0) {
    const { data: users, error: authErr } = await admin.auth.admin.listUsers()
    if (authErr) return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })

    const user = users.users.find(u => u.email?.toLowerCase() === email)
    if (!user) {
      return NextResponse.json(
        { error: 'Nenhum treinador encontrado com este email.' },
        { status: 404 }
      )
    }

    const { data: prof } = await admin
      .from('profiles')
      .select('athlete_id, nome')
      .eq('id', user.id)
      .like('athlete_id', 'TR-%')
      .single()

    if (!prof?.athlete_id) {
      return NextResponse.json(
        { error: 'Nenhum treinador encontrado com este email.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ treinadorId: prof.athlete_id, nome: prof.nome ?? '' })
  }

  const first = data[0]
  return NextResponse.json({ treinadorId: first.athlete_id, nome: first.nome ?? '' })
}
