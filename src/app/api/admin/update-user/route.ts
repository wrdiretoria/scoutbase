import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'wrdiretoria@gmail.com'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 403 })
  }

  const { userId, nome, email } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId obrigatÃ³rio' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email: email || undefined,
    user_metadata: { nome },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
