/**
 * /api/scout/favorito
 *
 * POST { atletaId: string } → toggle favorito (adiciona ou remove)
 * GET  → lista { favoritos: string[] } do scout logado
 *
 * Zero-schema: salva em user_metadata.favoritos do scout (array de auth UUIDs).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

// ── GET ── lista os favoritos do scout atual ──────────────────────────────────
export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ favoritos: [] })

    const favoritos = (user.user_metadata?.favoritos as string[] | null) ?? []
    return NextResponse.json({ favoritos })
  } catch {
    return NextResponse.json({ favoritos: [] })
  }
}

// ── POST ── toggle favorito ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { atletaId } = await req.json() as { atletaId?: string }
    if (!atletaId) return NextResponse.json({ error: 'atletaId obrigatório' }, { status: 400 })

    const favoritos: string[] = (user.user_metadata?.favoritos as string[] | null) ?? []
    const jaFavoritado = favoritos.includes(atletaId)

    const novosFavoritos = jaFavoritado
      ? favoritos.filter(id => id !== atletaId)
      : [...favoritos, atletaId]

    const admin = createAdminClient()

    // 1. Salva favoritos do scout
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { favoritos: novosFavoritos },
    })

    // 2. Atualiza favorito_count no user_metadata do atleta (social proof)
    try {
      const { data: { user: atletaUser } } = await admin.auth.admin.getUserById(atletaId)
      if (atletaUser) {
        const atual = (atletaUser.user_metadata?.favorito_count as number | null) ?? 0
        const novo  = Math.max(0, jaFavoritado ? atual - 1 : atual + 1)
        await admin.auth.admin.updateUserById(atletaId, {
          user_metadata: { favorito_count: novo },
        })
      }
    } catch { /* silencia — não bloqueia a resposta */ }

    return NextResponse.json({
      ok:         true,
      favoritado: !jaFavoritado,
      totalFavs:  novosFavoritos.length,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
