import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().toUpperCase()

  if (!q) return NextResponse.json({ error: 'ID não informado.' }, { status: 400 })

  // Normaliza: aceita "12345", "MC-12345", "TR-12345", "MC12345", "TR12345"
  const mcMatch = q.match(/(?:MC-?)?(\d{5})$/)
  const trMatch = q.match(/(?:TR-?)?(\d{5})$/)

  const admin = createAdminClient()

  // Tenta atleta primeiro se parece MC, senão tenta treinador se parece TR
  // Se sem prefixo, tenta ambos
  const looksLikeTR = q.startsWith('TR')
  const looksLikeMC = q.startsWith('MC') || (!looksLikeTR && mcMatch)

  const searchIds: string[] = []

  if (looksLikeTR && trMatch) {
    searchIds.push(`TR-${trMatch[1]}`)
  } else if (looksLikeMC && mcMatch) {
    searchIds.push(`MC-${mcMatch[1]}`)
  } else {
    // Sem prefixo: tenta ambos
    if (mcMatch) searchIds.push(`MC-${mcMatch[1]}`)
    if (trMatch) searchIds.push(`TR-${trMatch[1]}`)
  }

  if (searchIds.length === 0) {
    return NextResponse.json({ error: 'ID inválido. Use MC-12345 para atletas ou TR-12345 para treinadores.' }, { status: 400 })
  }

  const { data: rows } = await admin
    .from('profiles')
    .select('id, athlete_id')
    .in('athlete_id', searchIds)
    .limit(1)

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'Nenhum perfil encontrado com esse ID.' }, { status: 404 })
  }

  const row = rows[0] as { id: string; athlete_id: string }
  const isTreinador = (row.athlete_id ?? '').startsWith('TR-')

  return NextResponse.json({
    ok:   true,
    uuid: row.id,
    tipo: isTreinador ? 'treinador' : 'atleta',
    href: isTreinador ? `/treinador/${row.id}` : `/jogador/${row.id}`,
  })
}
