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

const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })

const alvo = users.filter(u => u.email?.endsWith('@meucraque.test'))

if (alvo.length === 0) {
  console.log('Nenhum usuário @meucraque.test encontrado.')
  process.exit(0)
}

console.log(`Encontrados ${alvo.length} usuário(s) para deletar:\n`)

let deletados = 0
const erros = []

for (const u of alvo) {
  const nome = u.user_metadata?.nome ?? '—'
  console.log(`  Deletando: ${nome.padEnd(25)} ${u.email}`)

  const { error } = await admin.auth.admin.deleteUser(u.id)

  if (error) {
    erros.push({ email: u.email, erro: error.message })
    console.log(`    ✗ ERRO: ${error.message}`)
  } else {
    console.log(`    ✓ deletado`)
    deletados++
  }
}

console.log(`\n${deletados} de ${alvo.length} usuário(s) deletado(s).`)
if (erros.length > 0) {
  console.log(`\nErros (${erros.length}):`)
  for (const e of erros) console.log(`  ${e.email}: ${e.erro}`)
}
