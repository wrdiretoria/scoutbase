/**
 * OVR real — fórmula 50/50:
 *   • 50% perfil (cadastro + currículo preenchido)
 *   • 50% avaliação de treinadores (média dos scout_score)
 *
 * Bridge direto: profiles.id (auth UUID) = avaliacoes.aluno_id
 * profiles.athlete_id (MC-XXXXX) é usado para mapear no ranking/busca.
 *
 * Fórmula do perfil (max 100 pts → × 0.5 = max 50 OVR):
 *   Base (nome + posicao + dob — obrigatórios no cadastro): 15 pts (sempre)
 *   Foto (avatar_url):                                      20 pts
 *   Questionário (questionario_completo em user_metadata):  20 pts
 *   Clubes anteriores (clubes_anteriores em user_metadata): 15 pts
 *   Campeonatos (campeonatos em user_metadata):             10 pts
 *   Títulos (titulos em user_metadata):                     10 pts
 *   Premiações (premiacoes em user_metadata):                5 pts
 *   Telefone (telefone em user_metadata):                    5 pts
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { listAllUsers } from '@/lib/auth'

type ProfileRow = {
  id:         string
  athlete_id: string | null
  avatar_url: string | null
}

type UserMeta = {
  questionario_completo?: boolean | string | null
  clubes_anteriores?:     string | null
  campeonatos?:           string | null
  titulos?:               string | null
  premiacoes?:            string | null
  telefone?:              string | null
}

function calcProfileScore(p: ProfileRow, meta: UserMeta): number {
  let score = 15  // base — nome + posicao + dob são obrigatórios no cadastro
  if (p.avatar_url)                         score += 20
  if (meta.questionario_completo)           score += 20
  if (meta.clubes_anteriores?.trim())       score += 15
  if (meta.campeonatos?.trim())             score += 10
  if (meta.titulos?.trim())                 score += 10
  if (meta.premiacoes?.trim())              score += 5
  if (meta.telefone?.trim())                score += 5
  return score  // 0–100
}

function calcOvr(profileScore: number, trainerAvg: number | null): number {
  // Perfil vale até 50 OVR (0–100 pts × 0.5)
  const profileOvr = Math.round(profileScore * 0.5)

  if (trainerAvg === null) {
    // Sem avaliação: máx 50 OVR
    return profileOvr
  }
  // Com avaliação: perfil (0–50) + avaliação (0–50) = max 100 OVR
  const trainerOvr = Math.round(trainerAvg * 0.5)
  return profileOvr + trainerOvr
}

// ── fetchOvrMap ────────────────────────────────────────────────────────────────

/**
 * Retorna Map<MC-ID, ovr> com todos os atletas que têm perfil cadastrado.
 * Use com o admin client (bypass RLS).
 */
export async function fetchOvrMap(admin: SupabaseClient): Promise<Map<string, number>> {
  const map = new Map<string, number>()

  // 1. Todos os perfis de atleta
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, athlete_id, avatar_url')
    .not('athlete_id', 'is', null)

  if (!profiles || profiles.length === 0) return map

  // 2. Todos os user_metadata de uma vez (evita N+1)
  const authUsers = await listAllUsers(admin)
  const metaByUuid = new Map<string, UserMeta>()
  for (const u of authUsers) {
    metaByUuid.set(u.id, (u.user_metadata ?? {}) as UserMeta)
  }

  // 3. Todas as avaliações com score
  const { data: avs } = await admin
    .from('avaliacoes')
    .select('aluno_id, scout_score')
    .not('scout_score', 'is', null)

  // Agrupa scores por UUID do atleta
  const scoresByUuid = new Map<string, number[]>()
  for (const av of (avs ?? []) as { aluno_id: string; scout_score: number }[]) {
    if (!av.aluno_id) continue
    if (!scoresByUuid.has(av.aluno_id)) scoresByUuid.set(av.aluno_id, [])
    scoresByUuid.get(av.aluno_id)!.push(av.scout_score)
  }

  // 4. Calcula OVR para cada atleta
  for (const profile of profiles as ProfileRow[]) {
    if (!profile.athlete_id) continue

    const meta = metaByUuid.get(profile.id) ?? {}
    const profileScore = calcProfileScore(profile, meta)

    const scores = scoresByUuid.get(profile.id)
    const trainerAvg = scores && scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

    const ovr = calcOvr(profileScore, trainerAvg)
    map.set(profile.athlete_id, ovr)
  }

  return map
}

// ── fetchOvrMapByUuid ──────────────────────────────────────────────────────────

/**
 * Igual a fetchOvrMap, mas keyed por UUID (profiles.id / auth UUID).
 * Usado pelo livefeed para mapear eventos direto pelo ID do atleta.
 */
export async function fetchOvrMapByUuid(admin: SupabaseClient): Promise<Map<string, number>> {
  const map = new Map<string, number>()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, athlete_id, avatar_url')
  // Sem filtro por athlete_id — calcula OVR para todos, mesmo sem MC-ID

  if (!profiles || profiles.length === 0) return map

  const authUsers = await listAllUsers(admin)

  const metaByUuid = new Map<string, UserMeta>()
  for (const u of authUsers) {
    metaByUuid.set(u.id, (u.user_metadata ?? {}) as UserMeta)
  }

  const { data: avs } = await admin
    .from('avaliacoes')
    .select('aluno_id, scout_score')
    .not('scout_score', 'is', null)

  const scoresByUuid = new Map<string, number[]>()
  for (const av of (avs ?? []) as { aluno_id: string; scout_score: number }[]) {
    if (!av.aluno_id) continue
    if (!scoresByUuid.has(av.aluno_id)) scoresByUuid.set(av.aluno_id, [])
    scoresByUuid.get(av.aluno_id)!.push(av.scout_score)
  }

  for (const profile of profiles as ProfileRow[]) {
    const meta         = metaByUuid.get(profile.id) ?? {}
    const profileScore = calcProfileScore(profile, meta)
    const scores       = scoresByUuid.get(profile.id)
    const trainerAvg   = scores && scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null
    map.set(profile.id, calcOvr(profileScore, trainerAvg))  // keyed by UUID
  }

  return map
}

// ── fetchOvrSingle ─────────────────────────────────────────────────────────────

/**
 * OVR de um único atleta pelo MC-ID.
 * Retorna null se o perfil não existir.
 */
export async function fetchOvrSingle(
  admin: SupabaseClient,
  mcId: string,
): Promise<number | null> {
  // 1. Perfil do atleta
  const { data: profile } = await admin
    .from('profiles')
    .select('id, athlete_id, avatar_url')
    .eq('athlete_id', mcId)
    .maybeSingle()

  if (!profile?.id) return null

  // 2. User metadata (campos do currículo salvos fora do schema)
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(profile.id)
  const meta = (authUser?.user_metadata ?? {}) as UserMeta

  const profileScore = calcProfileScore(profile as ProfileRow, meta)

  // 3. Avaliações do atleta
  const { data: avs } = await admin
    .from('avaliacoes')
    .select('scout_score')
    .eq('aluno_id', profile.id)
    .not('scout_score', 'is', null)

  const scores = (avs ?? []) as { scout_score: number }[]
  const trainerAvg = scores.length > 0
    ? Math.round(scores.map(a => a.scout_score).reduce((a, b) => a + b, 0) / scores.length)
    : null

  return calcOvr(profileScore, trainerAvg)
}
