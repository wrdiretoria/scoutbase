import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-check'

export async function POST(req: NextRequest) {
  const check = await verifyAdmin()
  if (!check.ok) return check.response

  const { userId, nome, email } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email: email || undefined,
    user_metadata: { nome },
  })

  if (error) return NextResponse.json({ error: 'Erro ao atualizar usuário.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
