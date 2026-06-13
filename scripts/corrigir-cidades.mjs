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

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

const CORRECOES = {
  'Belem':           'Belém',
  'Florianopolis':   'Florianópolis',
  'Goiania':         'Goiânia',
  'Joao Pessoa':     'João Pessoa',
  'Maceio':          'Maceió',
  'RIO DE JANEIRO':  'Rio de Janeiro',
  'Sao Luis':        'São Luís',
  'Sao Paulo':       'São Paulo',
  'Vitoria':         'Vitória',
}

const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })

let atualizados = 0
const erros = []

for (const u of users) {
  const cidadeAtual = u.user_metadata?.cidade

  // Corrige encoding corrompido de Brasília (qualquer variação que contenha 'Bras' e 'lia' mas não seja Brasília)
  const isBrasiliaCorreto = cidadeAtual === 'Brasília'
  const isBrasiliaQuebrado = cidadeAtual && cidadeAtual.startsWith('Bras') && cidadeAtual.endsWith('lia') && !isBrasiliaCorreto

  const correcao = CORRECOES[cidadeAtual] ?? (isBrasiliaQuebrado ? 'Brasília' : null)
  if (!correcao) continue

  const { error } = await admin.auth.admin.updateUserById(u.id, {
    user_metadata: { ...u.user_metadata, cidade: correcao },
  })

  if (error) {
    erros.push({ id: u.id, cidadeAtual, erro: error.message })
  } else {
    console.log(`✓  ${cidadeAtual.padEnd(22)} → ${correcao}  (${u.user_metadata?.tipo ?? '?'})`)
    atualizados++
  }
}

console.log(`\n${atualizados} usuário(s) atualizado(s).`)
if (erros.length > 0) {
  console.log(`\nErros (${erros.length}):`)
  for (const e of erros) console.log(`  ${e.id}  ${e.cidadeAtual}  ${e.erro}`)
}
