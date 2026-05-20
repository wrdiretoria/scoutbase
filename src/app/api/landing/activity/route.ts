import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 0

type ActivityItem =
  | { type: 'join';       name: string; role: 'Atleta' | 'Treinador'; ts: string }
  | { type: 'avaliacao';  atletaNome: string; treinadorNome: string; ovr: number; ts: string }

export async function GET() {
  try {
    const admin = createAdminClient()

    // Últimos 12 cadastros (atletas + treinadores)
    const { data: profiles } = await admin
      .from('profiles')
      .select('nome, athlete_id, created_at')
      .not('athlete_id', 'is', null)
      .not('nome', 'is', null)
      .order('created_at', { ascending: false })
      .limit(12)

    // Últimas 8 avaliações
    const { data: avs } = await admin
      .from('avaliacoes')
      .select('aluno_id, professor_id, scout_score, created_at')
      .not('scout_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8)

    const items: ActivityItem[] = []

    // Cadastros
    for (const p of profiles ?? []) {
      const id   = p.athlete_id as string
      const role = id.startsWith('MC-') ? 'Atleta' : id.startsWith('TR-') ? 'Treinador' : null
      if (!role) continue
      items.push({ type: 'join', name: p.nome as string, role, ts: p.created_at as string })
    }

    // Avaliações — busca nomes dos envolvidos
    if (avs && avs.length > 0) {
      const ids = [...new Set([
        ...(avs as { aluno_id: string; professor_id: string }[]).map(a => a.aluno_id),
        ...(avs as { aluno_id: string; professor_id: string }[]).map(a => a.professor_id),
      ])]

      const { data: pfs } = await admin
        .from('profiles')
        .select('id, nome')
        .in('id', ids)

      const nomeMap = new Map((pfs ?? []).map(p => [p.id as string, p.nome as string]))

      for (const av of avs as { aluno_id: string; professor_id: string; scout_score: number; created_at: string }[]) {
        const atletaNome   = nomeMap.get(av.aluno_id)   ?? 'Atleta'
        const treinadorNome = nomeMap.get(av.professor_id) ?? 'Treinador'
        items.push({ type: 'avaliacao', atletaNome, treinadorNome, ovr: av.scout_score, ts: av.created_at })
      }
    }

    // Ordena por data decrescente
    items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())

    return NextResponse.json({ items }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
