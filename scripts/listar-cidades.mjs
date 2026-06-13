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

const cidades = new Map()

for (const u of users) {
  const cidade = u.user_metadata?.cidade
  const tipo   = u.user_metadata?.tipo ?? '?'
  if (!cidade) continue
  if (!cidades.has(cidade)) cidades.set(cidade, new Set())
  cidades.get(cidade).add(tipo)
}

const sorted = [...cidades.entries()].sort((a, b) => a[0].localeCompare(b[0], 'pt-BR'))

console.log(`\nTotal de cidades distintas: ${sorted.length}\n`)
console.log('CIDADE'.padEnd(30) + 'TIPOS')
console.log('-'.repeat(50))
for (const [cidade, tipos] of sorted) {
  console.log(cidade.padEnd(30) + [...tipos].join(', '))
}
