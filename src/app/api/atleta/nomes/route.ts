/**
 * POST /api/atleta/nomes
 * Recebe { ids: string[] } (auth UUIDs) → retorna [{ id, nome, posicao, avatar_url }]
 * Usada pelo dashboard do treinador para mostrar nomes nos avaliados.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] }
    if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json([])

    const admin = createAdminClient()

    // Buscar avatar_url de cada perfil
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, avatar_url')
      .in('id', ids)

    const avatarMap = new Map(
      (profiles ?? []).map((p: { id: string; avatar_url: string | null }) => [p.id, p.avatar_url])
    )

    // Buscar metadados de auth (nome, posicao)
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const { data: { user } } = await admin.auth.admin.getUserById(id)
          const meta = user?.user_metadata as { nome?: string; posicao?: string } | undefined
          return {
            id,
            nome:       meta?.nome     ?? 'Atleta',
            posicao:    meta?.posicao  ?? '',
            avatar_url: avatarMap.get(id) ?? null,
          }
        } catch {
          return { id, nome: 'Atleta', posicao: '', avatar_url: null }
        }
      })
    )

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
