import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { verifyAdmin } from '@/lib/admin-check'

export async function POST(req: NextRequest) {
  const check = await verifyAdmin()
  if (!check.ok) return check.response

  const { userId, novaSenha } = await req.json()
  if (!userId || !novaSenha || novaSenha.length < 6) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: novaSenha })

  if (error) return NextResponse.json({ error: 'Erro ao redefinir senha.' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
