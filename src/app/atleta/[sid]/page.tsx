/**
 * /atleta/[sid] — Redireciona permanentemente para a rota canônica /jogador/[uuid]
 * ex: /atleta/82751  →  /jogador/dab54aaf-3bd3-4f1c-9b4c-a2e7cba87eb4
 *
 * Usa permanentRedirect (308) que equivale ao 301 para SEO —
 * motores de busca transferem o PageRank para a URL canônica.
 */

import { permanentRedirect, notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase'

type Props = { params: Promise<{ sid: string }> }

export default async function AtletaRedirectPage({ params }: Props) {
  const { sid } = await params
  const athleteId = `MC-${sid.toUpperCase()}`

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (!profile) {
    notFound()
  }

  permanentRedirect(`/jogador/${profile.id}`)
}
