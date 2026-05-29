import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gmlmmhdiuzumdjhnppha.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbG1taGRpdXp1bWRqaG5wcGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk3ODEyMiwiZXhwIjoyMDkyNTU0MTIyfQ.W5T3XASDe_b3RnIjIjMU-FW0WzeLJuE_Xp9xvLvccnc'

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Busca usuários e profiles ─────────────────────────────────────────────────
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
const atletas = users.filter(u => u.user_metadata?.tipo === 'atleta')
const ids = atletas.map(u => u.id)

const { data: profiles } = await admin
  .from('profiles')
  .select('id, athlete_id, avatar_url')
  .in('id', ids)

const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

// ── Busca OVRs ────────────────────────────────────────────────────────────────
const { data: avaliacoes } = await admin
  .from('avaliacoes')
  .select('aluno_id, scout_score')

const ovrRaw = new Map()
for (const av of avaliacoes ?? []) {
  if (!ovrRaw.has(av.aluno_id)) ovrRaw.set(av.aluno_id, [])
  ovrRaw.get(av.aluno_id).push(av.scout_score)
}

// ── Heurísticas de nome suspeito ──────────────────────────────────────────────
function nomeSuspeito(nome) {
  if (!nome || nome.trim() === '') return 'sem nome'
  const partes = nome.trim().split(/\s+/)
  // Palavra única (ex: "bento", "Atleta")
  if (partes.length === 1) return 'nome único'
  // Nome repetido (ex: "alan alan")
  if (partes.length === 2 && partes[0].toLowerCase() === partes[1].toLowerCase()) return 'nome duplicado'
  // Só iniciais ou muito curto (ex: "DS", "AB C")
  if (partes.every(p => p.length <= 2)) return 'só iniciais'
  // Palavras genéricas
  const genericos = ['atleta', 'teste', 'test', 'seed', 'demo', 'jogador', 'player', 'user']
  if (genericos.some(g => nome.toLowerCase().includes(g))) return 'nome genérico'
  return null
}

// ── Monta resultado ───────────────────────────────────────────────────────────
const resultados = atletas.map(u => {
  const meta    = u.user_metadata ?? {}
  const nome    = meta.nome ?? ''
  const cidade  = meta.cidade ?? '—'
  const profile = profileMap.get(u.id)
  const athleteId = profile?.athlete_id ?? null
  const temFoto   = !!(profile?.avatar_url)

  // OVR: média dos scout_scores (avaliação do treinador) — sem isso é null
  const scores = ovrRaw.get(u.id) ?? []
  const ovrTrainer = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null

  // Score de completude do perfil (simplificado — sem buscar todos os campos)
  // Apenas indica se tem avaliação ou não
  const temAvaliacao = scores.length > 0

  const razaoNome = nomeSuspeito(nome)
  const cadastro  = new Date(u.created_at).toLocaleDateString('pt-BR')

  return {
    id: u.id,
    nome,
    cidade,
    ovr: ovrTrainer,          // null = sem avaliação de treinador
    temFoto,
    temAvaliacao,
    athleteId,
    razaoNome,
    cadastro,
    email: u.email ?? '—',
  }
})

// ── Separa grupos ─────────────────────────────────────────────────────────────
const claramenteSeed = resultados.filter(r =>
  r.razaoNome !== null && !r.temAvaliacao && !r.temFoto
)

const incompletosMasReais = resultados.filter(r =>
  !claramenteSeed.includes(r) && (r.razaoNome !== null || r.ovr === null)
)

// ── Print ─────────────────────────────────────────────────────────────────────
function printGrupo(label, lista) {
  console.log(`\n${'='.repeat(70)}`)
  console.log(` ${label} (${lista.length})`)
  console.log('='.repeat(70))
  if (lista.length === 0) { console.log('  (nenhum)'); return }
  for (const r of lista) {
    const ovr  = r.ovr !== null ? String(r.ovr).padStart(3) : ' — '
    const foto = r.temFoto ? '📷' : '  '
    const av   = r.temAvaliacao ? '✓av' : '   '
    console.log(
      `${foto} ${av}  OVR:${ovr}  ${r.cadastro}  ${r.nome.padEnd(28)} ${r.cidade.padEnd(20)} [${r.razaoNome ?? 'ok'}]`
    )
    console.log(`        ID: ${r.id}  |  athlete_id: ${r.athleteId ?? 'sem id'}  |  email: ${r.email}`)
  }
}

printGrupo('CLARAMENTE SEED / TESTE  (sem foto, sem avaliação, nome suspeito)', claramenteSeed)
printGrupo('INCOMPLETOS — podem ser reais  (nome suspeito OU sem avaliação, mas têm foto ou avaliação)', incompletosMasReais)

console.log(`\nTotal atletas: ${atletas.length}  |  Seed/teste: ${claramenteSeed.length}  |  Incompletos-reais: ${incompletosMasReais.length}`)
