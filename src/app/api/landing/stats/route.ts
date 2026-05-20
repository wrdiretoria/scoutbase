import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 0

export async function GET() {
  try {
    const admin = createAdminClient()

    const [usersRes, avsRes] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from('avaliacoes').select('id', { count: 'exact', head: true }),
    ])

    const atletasCount    = (usersRes.data?.users ?? []).filter(u => u.user_metadata?.tipo === 'atleta').length
    const avaliacoesCount = avsRes.count ?? 0

    return NextResponse.json({ atletasCount, avaliacoesCount }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ atletasCount: 0, avaliacoesCount: 0 })
  }
}
