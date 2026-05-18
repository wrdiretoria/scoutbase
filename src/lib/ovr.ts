/**
 * OVR real — fórmula 50/50:
 *   • 50% perfil (cadastro + currículo preenchido)
 *   • 50% avaliação de treinadores (média dos scout_score)
 *
 * Bridge direto: profiles.id (auth UUID) = avaliacoes.aluno_id
 * profiles.athlete_id (MC-XXXXX) é usado para mapear no ranking/busca.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

// ── Pontuação do perfil ────────────────────────────────────────────────────────
// Campos obrigatórios (sempre preenchidos no cadastro): nome, avatar_url, data_nascimento = 30 pts
// Campos do currículo (opcionais): bio=20, altura=15, peso=15, pe_dominante=10, clube_atual=10 = 70 pts
// Total possível: 100 pts

type ProfileRow = {
  id:              string
  athlete_id:      string | null
  nome:            string | null
  avatar_url:      string | null
  data_nascimento: string | null
  bio:             string | null
  altura:          number | null
  peso:            number | null
  pe_dominante:    string | null
  clube_atual:     string | null
}

function calcProfileScore(p: ProfileRow): number {
  let score = 0
  if (p.nome)            score += 10
  if (p.avatar_url)      score += 10
  if (p.data_nascimento) score += 10
  if (p.bio)             score += 20
  if (p.altura)          score += 15
  if (p.peso)            score += 15
  if (p.pe_dominante)    score += 10
  if (p.clube_atual)     score += 10
  return score  // 0–100
}

function calcOvr(profileScore: number, trainerAvg: number | null): number {
  if (trainerAvg === null) {
    // Sem avaliação: OVR = 50% do perfil (máx 50 enquanto não avaliado)
    return Math.round(profileScore * 0.5)
  }
  return Math.round(profileScore * 0.5 + trainerAvg * 0.5)
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
    .select('id, athlete_id, nome, avatar_url, data_nascimento, bio, altura, peso, pe_dominante, clube_atual')
    .not('athlete_id', 'is', null)

  if (!profiles || profiles.length === 0) return map

  // 2. Todas as avaliações com score
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

  // 3. Calcula OVR para cada atleta
  for (const profile of profiles as ProfileRow[]) {
    if (!profile.athlete_id) continue

    const profileScore = calcProfileScore(profile)

    const scores = scoresByUuid.get(profile.id)
    const trainerAvg = scores && scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null

    const ovr = calcOvr(profileScore, trainerAvg)
    map.set(profile.athlete_id, ovr)
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
    .select('id, athlete_id, nome, avatar_url, data_nascimento, bio, altura, peso, pe_dominante, clube_atual')
    .eq('athlete_id', mcId)
    .maybeSingle()

  if (!profile?.id) return null

  const profileScore = calcProfileScore(profile as ProfileRow)

  // 2. Avaliações do atleta
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
