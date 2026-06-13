import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-check'

export async function POST(req: NextRequest) {
  const check = await verifyAdmin()
  if (!check.ok) return check.response

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)

  if (error) return NextResponse.json({ error: 'Erro ao deletar usuário.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
