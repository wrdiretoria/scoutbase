/**
 * seed.mjs — Seed data para Meu Craque
 *
 * Cria:  20 atletas fictícios + 4 treinadores
 *        fotos Unsplash únicas por atleta (3-5 por card)
 *        ~30 avaliações distribuídas nos últimos 7 dias
 *        ~40 visitas de scouts
 *
 * Rodar: node scripts/seed.mjs
 *
 * Para remover todos os dados de seed no futuro:
 *   node scripts/seed.mjs --limpar
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// ─── Carrega .env.local ────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '..', '.env.local')

if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
    if (key) process.env[key] = val
  }
  console.log('✅  .env.local carregado')
} else {
  console.warn('⚠️   .env.local não encontrado — usando variáveis de ambiente existentes')
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ───────────────────────────────────────────────────────────────────
const ri = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

function tsInPast(daysAgo, hour) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, ri(0, 59), ri(0, 59), 0)
  return d.toISOString()
}

// ─── Pool de fotos Unsplash (80 IDs únicos — futebol / esporte / treino) ───────
// Cada ID é usado no máximo uma vez por "rodada" — atletas nunca compartilham foto
const FOTO_IDS = [
  '1517466668698-5b0d93c24b86', '1579952377613-702b5f8d2c39',
  '1526232761462-2b79f17c3830', '1544882969-7e7a8fce9555',
  '1486870591958-9b9d0d1dda99', '1503676260728-1c00da094a0b',
  '1540747913-58da8b5a6f51',    '1574629171-1b73a49fcb3a',
  '1558618047-3ef35e0e7e4f',    '1575361204480-aadea25e6e68',
  '1546519638-68355431b0e8',    '1543326727-cf6a674d4f2b',
  '1560272564-c83b66b1ad12',    '1571019613914-85f342c6a11e',
  '1580742478-84a9bfab1c29',    '1600181864-32c8c90ef9ae',
  '1622979135225-d2ba269cf1ac', '1614632537190-23c7db1f3e88',
  '1578393098337-24d0bab399f0', '1601415488268-53d0b2c3c7d2',
  '1571892673219-1c4eb1dbe6d1', '1600679472229-3611b11a68db',
  '1587563967167-1f50e4e5e6d8', '1531315630914-6c71c40f0a5c',
  '1545671913-b89ac1b4ac10',    '1470319559554-74244a9fbb78',
  '1518604664-f1f2bcb5d8d8',    '1490633874781-1c63cc424610',
  '1527090526205-beaac8dc3c45', '1562883678-6eb6a04b4e8d',
  '1570498839593-e565b39455fc', '1551958219-acbc595980a9',
  '1610284215011-5f4aeb58bdb4', '1551254019-1003c34da4c4',
  '1547647311-6ad5fbe84c43',    '1576274093-6cf97f0cc1b3',
  '1606092672100-e020fd2d7dd2', '1531437571429-a1d2fa8028e3',
  '1563708853756-8e4da038ad2a', '1552667466-07770ae110d0',
  '1590073044059-1f83a8c00a87', '1520904574851-c7f84e20ce5e',
  '1519766304817-4f37bca61acb', '1626248801379-c2eedf3aef28',
  '1543357480-7d43b3872869',    '1559053406-b7a9a7d99d14',
  '1584464491033-c7c90aaed7c1', '1589487391730-58e10c8f1b9c',
  '1555448248-2571daf6e5f7',    '1556056504-cf30e8f70c72',
  '1583891538297-ec04741e1ddd', '1584397641296-9ee43c6b8c5a',
  '1608889175638-9a2bd8234e23', '1612360737783-04f1e3e9cce9',
  '1617711164-39dc5fa1a7e6',    '1618183851099-09295bbaff2c',
  '1621975561023-9b0a0c33e2d2', '1625048741011-4e4fd6f97fb5',
  '1628622498523-3b5d4d81c9b5', '1630840036305-b0d1fc8a7b3e',
  '1633881591289-c4bafc4e5e3e', '1636547799617-35f297171c7c',
  '1642512636257-73ceab4d4c9a', '1643390396154-96bd54df6949',
  '1645622534-84b3ff3d83d6',    '1648322508682-08b04a27df55',
  '1650469375664-7ae4bb0e38d7', '1651946892-cb17a40028d1',
  '1655640537-1fc97bf5bdf7',    '1598300942904-1e5e7d0f87b8',
  '1612872087720-3b8a7e9c2e56', '1629152117730-8ad87ec61434',
  '1639158906-d4ab7b58a38e',    '1641813547481-34cc5b3e8c0f',
  '1644388141-e5cc24b9e71d',    '1647046249-c9f3b5d4d3a6',
  '1651074812549-4c1b8e8e4a0b', '1657890123456-ab12cd34ef56',
]

// Embaralha e distribui sem repetição
const _shuffled = [...FOTO_IDS].sort(() => Math.random() - 0.5)
let _photoIdx = 0
function nextPhotoUrl() {
  // Recicla em rodadas caso exceda o pool
  const id = _shuffled[_photoIdx % _shuffled.length]
  _photoIdx++
  return `https://images.unsplash.com/photo-${id}?w=400&q=80`
}
function pickPhotos(n) {
  return Array.from({ length: n }, () => nextPhotoUrl())
}

// ─── Atributos coerentes com posição e OVR ─────────────────────────────────────
// Escala interna: 2–10 (igual ao sistema real do app)
const POS_WEIGHTS = {
  ATA: { tec: 1.10, vel: 1.15, fin: 1.20, for: 0.90, fis: 0.95, tat: 0.90, vis: 0.95, pos: 1.05, com: 1.00 },
  MEI: { tec: 1.15, vel: 1.00, fin: 1.00, for: 0.85, fis: 0.90, tat: 1.10, vis: 1.15, pos: 1.05, com: 1.00 },
  ZAG: { tec: 0.95, vel: 0.90, fin: 0.70, for: 1.15, fis: 1.15, tat: 1.10, vis: 1.00, pos: 1.10, com: 1.05 },
  LAT: { tec: 1.00, vel: 1.20, fin: 0.85, for: 0.95, fis: 1.05, tat: 1.00, vis: 1.00, pos: 1.00, com: 1.00 },
  VOL: { tec: 1.00, vel: 1.00, fin: 0.85, for: 1.05, fis: 1.10, tat: 1.15, vis: 1.10, pos: 1.05, com: 1.10 },
  GOL: { tec: 1.05, vel: 0.85, fin: 0.60, for: 0.95, fis: 1.00, tat: 1.05, vis: 1.05, pos: 1.10, com: 1.10 },
}

function gerarAtributos(posicao, ovr) {
  const w = POS_WEIGHTS[posicao] ?? POS_WEIGHTS.ATA
  const base = ovr / 10  // OVR 80 → base 8.0
  const v = (peso) => clamp(Math.round(base * peso + (Math.random() * 1.6 - 0.8)), 2, 10)

  const tecnica_v      = v(w.tec)
  const velocidade_v   = v(w.vel)
  const finalizacao_v  = v(w.fin)
  const forca_v        = v(w.for)
  const visao_v        = v(w.vis)
  const posic_v        = v(w.pos)
  const comp1_v        = v(w.com)
  const comp2_v        = v(w.com)

  return {
    tecnico:        tecnica_v,
    fisico:         clamp(Math.round((forca_v + velocidade_v) / 2), 2, 10),
    tatico:         clamp(Math.round((v(w.tat) + visao_v) / 2), 2, 10),
    comportamento:  clamp(Math.round((comp1_v + comp2_v) / 2), 2, 10),
    velocidade:     velocidade_v,
    forca:          forca_v,
    finalizacao:    finalizacao_v,
    visao_jogo:     visao_v,
    posicionamento: posic_v,
    tecnica:        tecnica_v,
  }
}

// ─── Dados dos atletas ──────────────────────────────────────────────────────────
const ATLETAS = [
  { nome: 'Gabriel Henrique Santos',   posicao: 'ATA', cidade: 'São Paulo',      ovr: 88, nasc: '2007-03-14', nFotos: 5 },
  { nome: 'Mateus Oliveira',           posicao: 'MEI', cidade: 'Rio de Janeiro', ovr: 82, nasc: '2008-07-22', nFotos: 4 },
  { nome: 'Lucas Ferreira da Silva',   posicao: 'ZAG', cidade: 'Belo Horizonte', ovr: 79, nasc: '2007-11-05', nFotos: 3 },
  { nome: 'João Pedro Almeida',        posicao: 'LAT', cidade: 'Salvador',       ovr: 76, nasc: '2009-02-18', nFotos: 4 },
  { nome: 'Kaique Ribeiro',            posicao: 'VOL', cidade: 'Fortaleza',      ovr: 84, nasc: '2008-09-30', nFotos: 5 },
  { nome: 'Vitor Hugo Souza',          posicao: 'ATA', cidade: 'Recife',         ovr: 78, nasc: '2009-04-11', nFotos: 3 },
  { nome: 'Daniel Costa Pereira',      posicao: 'MEI', cidade: 'Porto Alegre',   ovr: 86, nasc: '2007-06-28', nFotos: 5 },
  { nome: 'Felipe Gomes',              posicao: 'GOL', cidade: 'Curitiba',       ovr: 72, nasc: '2011-12-03', nFotos: 3 },
  { nome: 'Rafael Mendes Araújo',      posicao: 'ZAG', cidade: 'Manaus',         ovr: 75, nasc: '2008-08-17', nFotos: 4 },
  { nome: 'Thiago Barbosa Leal',       posicao: 'ATA', cidade: 'Campinas',       ovr: 91, nasc: '2008-01-09', nFotos: 5 },
  { nome: 'Enzo Carvalho',             posicao: 'MEI', cidade: 'Brasília',       ovr: 83, nasc: '2009-05-25', nFotos: 4 },
  { nome: 'Pedro Henrique Lima',       posicao: 'VOL', cidade: 'Belém',          ovr: 77, nasc: '2008-10-14', nFotos: 3 },
  { nome: 'Gustavo Rocha Nascimento',  posicao: 'LAT', cidade: 'Goiânia',        ovr: 74, nasc: '2010-07-08', nFotos: 4 },
  { nome: 'Arthur Dias',               posicao: 'ATA', cidade: 'São Luís',       ovr: 80, nasc: '2008-03-31', nFotos: 3 },
  { nome: 'Caio Martins',              posicao: 'ZAG', cidade: 'Natal',          ovr: 73, nasc: '2008-11-20', nFotos: 4 },
  { nome: 'Ryan Pereira de Melo',      posicao: 'MEI', cidade: 'Maceió',         ovr: 70, nasc: '2011-09-04', nFotos: 3 },
  { nome: 'Samuel Nunes',              posicao: 'VOL', cidade: 'Teresina',       ovr: 76, nasc: '2009-12-16', nFotos: 4 },
  { nome: 'Henrique Castro',           posicao: 'ATA', cidade: 'Florianópolis',  ovr: 89, nasc: '2007-02-07', nFotos: 5 },
  { nome: 'Bernardo Araújo',           posicao: 'GOL', cidade: 'Vitória',        ovr: 71, nasc: '2010-06-23', nFotos: 3 },
  { nome: 'Murilo Rodrigues Silva',    posicao: 'LAT', cidade: 'Cuiabá',         ovr: 78, nasc: '2009-08-15', nFotos: 4 },
]

const TREINADORES = [
  { nome: 'Carlos Eduardo Ferreira', cidade: 'São Paulo'      },
  { nome: 'Marcos Roberto Silva',    cidade: 'Rio de Janeiro' },
  { nome: 'Paulo Henrique Andrade',  cidade: 'Belo Horizonte' },
  { nome: 'Roberto Carlos Matos',    cidade: 'Porto Alegre'   },
]

// ─── Timestamps realistas nos últimos 7 dias ───────────────────────────────────
// Pico de atividade 16h–22h (BRT = UTC−3, então 19h–01h UTC)
// joinTimes: 20 entradas de atletas distribuídas ao longo de 7 dias
const joinTimes = [
  tsInPast(7, 17), tsInPast(7, 20),
  tsInPast(6, 16), tsInPast(6, 19), tsInPast(6, 21),
  tsInPast(5, 17), tsInPast(5, 20),
  tsInPast(4, 15), tsInPast(4, 18), tsInPast(4, 20), tsInPast(4, 22),
  tsInPast(3, 16), tsInPast(3, 19), tsInPast(3, 21),
  tsInPast(2, 17), tsInPast(2, 20),
  tsInPast(1, 16), tsInPast(1, 18), tsInPast(1, 21),
  tsInPast(0, 17),
]

// evalTimes: 30 avaliações — mais recentes nos últimos dias
const evalTimes = [
  // Dia 7 atrás (2 eventos)
  tsInPast(7, 17), tsInPast(7, 20),
  // Dia 6 (3 eventos)
  tsInPast(6, 16), tsInPast(6, 18), tsInPast(6, 21),
  // Dia 5 (4 eventos)
  tsInPast(5, 15), tsInPast(5, 17), tsInPast(5, 19), tsInPast(5, 22),
  // Dia 4 (4 eventos)
  tsInPast(4, 16), tsInPast(4, 18), tsInPast(4, 20), tsInPast(4, 21),
  // Dia 3 (5 eventos)
  tsInPast(3, 15), tsInPast(3, 17), tsInPast(3, 18), tsInPast(3, 20), tsInPast(3, 22),
  // Dia 2 (6 eventos)
  tsInPast(2, 16), tsInPast(2, 17), tsInPast(2, 18), tsInPast(2, 19), tsInPast(2, 21), tsInPast(2, 22),
  // Dia 1 e hoje (6 eventos)
  tsInPast(1, 16), tsInPast(1, 18), tsInPast(1, 20), tsInPast(0, 15), tsInPast(0, 17), tsInPast(0, 19),
]
// assert: 2+3+4+4+5+6+6 = 30 ✓

// ─── Modo limpeza ──────────────────────────────────────────────────────────────
async function limpar() {
  console.log('\n🗑️   Removendo dados de seed...\n')

  // Busca todos os usuários seed
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const seedEmails = users.filter(u =>
    u.email?.includes('.seed') && u.email?.endsWith('@meucraque.app')
  )

  const ids = seedEmails.map(u => u.id)
  console.log(`  Encontrados ${ids.length} usuários seed`)

  if (ids.length > 0) {
    // Remove avaliações onde professor_id ou aluno_id é seed
    await admin.from('avaliacoes').delete().in('aluno_id', ids)
    await admin.from('avaliacoes').delete().in('professor_id', ids)
    // Remove visitas
    await admin.from('visitas').delete().in('atleta_id', ids)
    // Remove profiles
    await admin.from('profiles').delete().in('id', ids)
    // Remove auth users
    for (const u of seedEmails) {
      await admin.auth.admin.deleteUser(u.id)
      console.log(`  ❌  ${u.email} removido`)
    }
  }

  console.log('\n✅  Limpeza concluída')
  process.exit(0)
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  if (process.argv.includes('--limpar')) {
    await limpar()
    return
  }

  console.log('\n🌱  Seed Meu Craque — iniciando...\n')

  // Carrega lista de usuários existentes uma vez (evita N+1 nas verificações)
  const { data: authData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (listErr) { console.error('❌  listUsers falhou:', listErr.message); process.exit(1) }
  const existingEmails = new Map(
    (authData?.users ?? []).map(u => [u.email, u.id])
  )

  // ── 1. Treinadores ──────────────────────────────────────────────────────────
  console.log('👨‍🏫  Treinadores:')
  const treinadorIds = []

  for (let i = 0; i < TREINADORES.length; i++) {
    const t = TREINADORES[i]
    const email = `treinador.seed${i + 1}@meucraque.app`
    const trId  = `TR-${String(10001 + i).slice(1)}`

    let userId = existingEmails.get(email)

    if (userId) {
      console.log(`  ↩   ${t.nome} já existe (${userId.slice(0,8)}...)`)
      // Atualiza user_metadata caso o usuário já existia sem cidade
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { tipo: 'treinador', nome: t.nome, cidade: t.cidade },
      })
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: 'SeedTreinador2024!',
        email_confirm: true,
        // cidade em user_metadata (não na tabela profiles)
        user_metadata: { tipo: 'treinador', nome: t.nome, cidade: t.cidade },
      })
      if (error) { console.error(`  ❌  ${t.nome}: ${error.message}`); continue }
      userId = data.user.id
      console.log(`  ✅  ${t.nome} criado`)
    }

    const { error: pErr } = await admin.from('profiles').upsert({
      id:         userId,
      nome:       t.nome,
      athlete_id: trId,
      email:      email,
      // cidade não existe como coluna — está em user_metadata
    }, { onConflict: 'id' })

    if (pErr) console.error(`  ❌  profile ${trId}: ${pErr.message}`)
    else console.log(`  📋  Profile ${trId}`)

    treinadorIds.push(userId)
  }

  if (treinadorIds.length === 0) {
    console.error('❌  Nenhum treinador disponível — abortando')
    process.exit(1)
  }

  // ── 2. Atletas ──────────────────────────────────────────────────────────────
  console.log('\n⚽  Atletas:')
  const atletaList = [] // { userId, posicao, ovr }

  for (let i = 0; i < ATLETAS.length; i++) {
    const a    = ATLETAS[i]
    const email = `atleta.seed${String(i + 1).padStart(2, '0')}@meucraque.app`
    const mcId  = `MC-${String(10001 + i).slice(1)}`
    const fotos = pickPhotos(a.nFotos)

    let userId = existingEmails.get(email)

    // Currículo completo → garante profileScore 100 → profileOvr 50
    // Sem isso, OVR exibido = ~7 (perfil base) + scout_score/2 ≈ 50–54 em vez de 72–96
    const curriculoMeta = {
      questionario_completo: true,
      clubes_anteriores:     `${a.cidade} FC`,
      campeonatos:           'Copa Regional Sub-17',
      titulos:               'Campeão Estadual Sub-17',
      premiacoes:            'Melhor Jogador do Torneio',
      telefone:              '11999999999',
    }

    if (userId) {
      console.log(`  ↩   ${a.nome} já existe — atualizando metadados`)
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: {
          tipo: 'atleta', posicao: a.posicao, nome: a.nome,
          cidade: a.cidade, cards_disponiveis: 0,
          ...curriculoMeta,
        },
      })
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: 'SeedAtleta2024!',
        email_confirm: true,
        user_metadata: {
          tipo:              'atleta',
          posicao:           a.posicao,
          nome:              a.nome,
          cidade:            a.cidade,
          cards_disponiveis: 0,
          ...curriculoMeta,
        },
      })
      if (error) { console.error(`  ❌  ${a.nome}: ${error.message}`); continue }
      userId = data.user.id
      console.log(`  ✅  ${a.nome} | ${a.posicao} | OVR ${a.ovr} | ${fotos.length} fotos`)
    }

    const { error: pErr } = await admin.from('profiles').upsert({
      id:              userId,
      nome:            a.nome,
      athlete_id:      mcId,
      email:           `${mcId.toLowerCase()}@meucraque.app`,
      data_nascimento: a.nasc,
      fotos:           fotos,
      // avatar_url = primeira foto → +20 pts no profileScore
      avatar_url:      fotos[0] ?? null,
    }, { onConflict: 'id' })

    if (pErr) console.error(`  ❌  profile ${mcId}: ${pErr.message}`)
    else console.log(`  📋  ${mcId} | ${a.cidade} | entrou ${joinTimes[i].slice(0, 10)}`)

    atletaList.push({ userId, posicao: a.posicao, ovr: a.ovr })
  }

  if (atletaList.length === 0) {
    console.error('❌  Nenhum atleta disponível — abortando')
    process.exit(1)
  }

  // ── 3. Avaliações (30) ─────────────────────────────────────────────────────
  console.log('\n📊  Avaliações:')

  // Verifica avaliações seed já existentes (idempotência)
  const seedAlunoIds = atletaList.map(a => a.userId)
  const { data: existingAvs } = await admin
    .from('avaliacoes')
    .select('aluno_id, professor_id')
    .in('aluno_id', seedAlunoIds)
  const existingAvSet = new Set(
    (existingAvs ?? []).map(av => `${av.aluno_id}:${av.professor_id}`)
  )
  console.log(`  ℹ️   ${existingAvSet.size} avaliações seed já existem — só insere novas`)

  // Distribui: primeiros 10 atletas recebem 2 avaliações, demais 1
  // (total = 10×2 + 10×1 = 30)
  const plano = []
  for (let i = 0; i < atletaList.length; i++) {
    const qty = i < 10 ? 2 : 1
    for (let j = 0; j < qty; j++) plano.push(atletaList[i])
  }
  // plano.length deve ser 30

  for (let idx = 0; idx < Math.min(plano.length, evalTimes.length); idx++) {
    const { userId: atletaId, posicao, ovr } = plano[idx]
    const treinadorId = treinadorIds[idx % treinadorIds.length]

    // Pula se já existe avaliação desse treinador para esse atleta
    const key = `${atletaId}:${treinadorId}`
    if (existingAvSet.has(key)) {
      console.log(`  ⏭️   [${idx + 1}/30] já existe — pulando`)
      continue
    }
    existingAvSet.add(key) // registra pra evitar duplicata mesmo sem DB check

    const a = gerarAtributos(posicao, ovr)
    const ts = evalTimes[idx]

    const obsOptions = [
      `Atleta com potencial ${ovr >= 85 ? 'elite' : ovr >= 78 ? 'alto' : 'médio'}. Boa disciplina tática.`,
      `Destaque no treino. Evolução consistente nas últimas semanas.`,
      `Bom trabalho defensivo. Precisa melhorar saída de bola.`,
      `Velocidade acima da média para a faixa etária. Finalização a aprimorar.`,
      null, null, // 2 em 6 sem observação
    ]
    const observacao = obsOptions[idx % obsOptions.length]

    const { error } = await admin.from('avaliacoes').insert({
      professor_id:   treinadorId,
      aluno_id:       atletaId,
      scout_score:    ovr,
      tecnico:        a.tecnico,
      fisico:         a.fisico,
      tatico:         a.tatico,
      comportamento:  a.comportamento,
      velocidade:     a.velocidade,
      forca:          a.forca,
      finalizacao:    a.finalizacao,
      visao_jogo:     a.visao_jogo,
      posicionamento: a.posicionamento,
      tecnica:        a.tecnica,
      observacao,
      created_at:     ts,
    })

    if (error) {
      console.error(`  ❌  Avaliação ${idx + 1}: ${error.message}`)
    } else {
      const dia = ts.slice(0, 10), hora = ts.slice(11, 16)
      console.log(`  ✅  [${idx + 1}/30] OVR ${ovr} | ${posicao} | ${dia} ${hora}`)
    }
  }

  // ── 4. Visitas de scouts (40) ─────────────────────────────────────────────
  console.log('\n👁️   Visitas:')
  const atletaIdsParaVisita = atletaList.slice(0, 12).map(a => a.userId)
  let visitasOk = 0

  for (let v = 0; v < 40; v++) {
    const atletaId = atletaIdsParaVisita[v % atletaIdsParaVisita.length]
    const ts = tsInPast(ri(0, 7), ri(10, 22))
    const { error } = await admin.from('visitas').insert({ atleta_id: atletaId, created_at: ts })
    if (!error) visitasOk++
  }
  console.log(`  ✅  ${visitasOk}/40 visitas inseridas`)

  // ── 5. Verificação final ─────────────────────────────────────────────────────
  console.log('\n🔍  Verificação:')

  const [
    { count: avCount  },
    { count: profCount },
    { count: visCount  },
  ] = await Promise.all([
    admin.from('avaliacoes').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).not('athlete_id', 'is', null),
    admin.from('visitas').select('*', { count: 'exact', head: true }),
  ])

  // Top atleta
  const { data: topAv } = await admin
    .from('avaliacoes')
    .select('aluno_id, scout_score')
    .not('scout_score', 'is', null)
    .order('scout_score', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: topProfile } = topAv?.aluno_id
    ? await admin.from('profiles').select('nome').eq('id', topAv.aluno_id).maybeSingle()
    : { data: null }

  // busca posicao em user_metadata
  const { data: topAuthUser } = topAv?.aluno_id
    ? await admin.auth.admin.getUserById(topAv.aluno_id)
    : { data: null }
  const topPosicao = topAuthUser?.user?.user_metadata?.posicao ?? ''

  console.log(`  📊  Avaliações total:     ${avCount}`)
  console.log(`  👤  Profiles (atleta+TR): ${profCount}`)
  console.log(`  👁️   Visitas:              ${visCount}`)
  if (topAv) console.log(`  🏆  Top atleta OVR ${topAv.scout_score} (${topPosicao}): ${topProfile?.nome ?? '—'}`)

  console.log('\n🎉  Seed concluído com sucesso!')
  console.log('─────────────────────────────────────────')
  console.log('  Verifique agora:')
  console.log('  → Landing page  (feed ao vivo, cards ciclando, ranking)')
  console.log('  → /api/landing/livefeed')
  console.log('  → /api/landing/atletas')
  console.log('  → Para limpar:  node scripts/seed.mjs --limpar')
  console.log('─────────────────────────────────────────\n')
}

main().catch(err => {
  console.error('\n❌  Erro fatal:', err)
  process.exit(1)
})
