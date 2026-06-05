import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 30

export async function GET() {
  try {
    const admin = createAdminClient()

    const [atletasRes, avsRes] = await Promise.all([
      admin.from('profiles').select('id', { count: 'exact', head: true }).like('athlete_id', 'MC-%'),
      admin.from('avaliacoes').select('id', { count: 'exact', head: true }),
    ])

    const atletasCount    = atletasRes.count ?? 0
    const avaliacoesCount = avsRes.count ?? 0

    return NextResponse.json({ atletasCount, avaliacoesCount }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ atletasCount: 0, avaliacoesCount: 0 })
  }
}
