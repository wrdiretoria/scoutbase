/**
 * scripts/backfill-athlete-ids.mjs
 * Preenche athlete_id para todos os atletas que estão com null no banco.
 * Algoritmo idêntico ao /api/atleta/gerar-id: MC-XXXXX (5 dígitos, único).
 *
 * Uso: node scripts/backfill-athlete-ids.mjs
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dir, '..', '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (k) process.env[k] = v
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomNum() {
  return Math.floor(Math.random() * 100000).toString().padStart(5, '0')
}

async function gerarIdUnico(usados) {
  for (let t = 0; t < 30; t++) {
    const num = randomNum()
    const id  = `MC-${num}`
    if (!usados.has(id)) {
      usados.add(id)
      return id
    }
  }
  throw new Error('Não foi possível gerar ID único após 30 tentativas')
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Checar Noah especificamente
  const NOAH_UUID = '793a9824-f0c4-49f4-b73e-31d7f559e7a4'
  const { data: noahProfile, error: noahErr } = await admin
    .from('profiles')
    .select('id, athlete_id')
    .eq('id', NOAH_UUID)
    .maybeSingle()

  if (noahErr) {
    console.error('Erro ao buscar Noah:', noahErr.message)
  } else if (!noahProfile) {
    console.log('⚠️  Noah não encontrado na tabela profiles')
  } else {
    console.log(`Noah Coelho (${NOAH_UUID}): athlete_id = ${noahProfile.athlete_id ?? 'NULL'}`)
  }

  // 2. Buscar todos os athlete_id já em uso (para evitar colisão)
  const { data: todos, error: todosErr } = await admin
    .from('profiles')
    .select('id, athlete_id')
    .not('athlete_id', 'is', null)

  if (todosErr) throw new Error('Erro ao listar IDs em uso: ' + todosErr.message)

  const usados = new Set((todos ?? []).map(r => r.athlete_id))
  console.log(`\n✅ IDs já cadastrados: ${usados.size}`)

  // 3. Buscar todos os perfis SEM athlete_id
  const { data: semId, error: semErr } = await admin
    .from('profiles')
    .select('id, athlete_id')
    .is('athlete_id', null)

  if (semErr) throw new Error('Erro ao listar sem ID: ' + semErr.message)

  if (!semId || semId.length === 0) {
    console.log('\n🎉 Todos os atletas já têm athlete_id. Nada a fazer.')
    return
  }

  console.log(`\n⚠️  Atletas SEM athlete_id: ${semId.length}`)
  semId.forEach(r => console.log(`   - ${r.id}`))

  // 4. Gerar e salvar IDs para cada um
  console.log('\n🔧 Gerando e salvando IDs...')
  let ok = 0
  let fail = 0

  for (const perfil of semId) {
    try {
      const novoId = await gerarIdUnico(usados)

      const { error: upErr } = await admin
        .from('profiles')
        .update({ athlete_id: novoId })
        .eq('id', perfil.id)

      if (upErr) {
        console.error(`  ❌ ${perfil.id} → ERRO: ${upErr.message}`)
        fail++
      } else {
        console.log(`  ✅ ${perfil.id} → ${novoId}`)
        ok++
      }
    } catch (e) {
      console.error(`  ❌ ${perfil.id} → ${e.message}`)
      fail++
    }
  }

  console.log(`\n📊 Resultado: ${ok} atualizados, ${fail} falhas`)

  // 5. Confirmar Noah
  const { data: noahFinal } = await admin
    .from('profiles')
    .select('athlete_id')
    .eq('id', NOAH_UUID)
    .maybeSingle()
  console.log(`\n🔍 Noah agora: athlete_id = ${noahFinal?.athlete_id ?? 'ainda NULL'}`)
}

main().catch(err => { console.error(err); process.exit(1) })
