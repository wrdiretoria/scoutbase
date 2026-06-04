import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { listAllUsers } from '@/lib/auth'

export const revalidate = 30

export async function GET() {
  try {
    const admin = createAdminClient()

    const [authUsers, avsRes] = await Promise.all([
      listAllUsers(admin),
      admin.from('avaliacoes').select('id', { count: 'exact', head: true }),
    ])

    const atletasCount    = authUsers.filter(u => u.user_metadata?.tipo === 'atleta').length
    const avaliacoesCount = avsRes.count ?? 0

    return NextResponse.json({ atletasCount, avaliacoesCount }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ atletasCount: 0, avaliacoesCount: 0 })
  }
}
