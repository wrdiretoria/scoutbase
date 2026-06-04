import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { listAllUsers } from '@/lib/auth'

export const revalidate = 30

type ActivityItem =
  | { type: 'join';       name: string; role: 'Atleta' | 'Treinador'; ts: string }
  | { type: 'avaliacao';  atletaNome: string; treinadorNome: string; ovr: number; ts: string }

export async function GET() {
  try {
    const admin = createAdminClient()

    // Últimos 12 cadastros (atletas + treinadores) via auth.users
    const allUsers = await listAllUsers(admin)
    const recentUsers = allUsers
      .filter(u => u.user_metadata?.nome && ['atleta', 'treinador'].includes(u.user_metadata?.tipo))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12)

    // Últimas 8 avaliações
    const { data: avs } = await admin
      .from('avaliacoes')
      .select('aluno_id, professor_id, scout_score, created_at')
      .not('scout_score', 'is', null)
      .order('created_at', { ascending: false })
      .limit(8)

    const items: ActivityItem[] = []

    // Cadastros
    for (const u of recentUsers) {
      const tipo = u.user_metadata?.tipo as string
      const role: 'Atleta' | 'Treinador' = tipo === 'treinador' ? 'Treinador' : 'Atleta'
      items.push({ type: 'join', name: u.user_metadata.nome as string, role, ts: u.created_at })
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
