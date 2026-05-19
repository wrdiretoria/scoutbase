/**
 * Migration script — adiciona coluna respostas JSONB na tabela avaliacoes.
 * Uso: node scripts/migrate.mjs
 */
import pg from 'pg'
import { readFileSync } from 'fs'

const { Client } = pg

// Lê .env.local para pegar a URL do projeto
const env = readFileSync('.env.local', 'utf8')
const getEnv = (key) => env.match(new RegExp(`^${key}=(.+)$`, 'm'))?.[1]?.trim()

const projectRef  = 'gmlmmhdiuzumdjhnppha'
const serviceRole = getEnv('SUPABASE_SERVICE_ROLE_KEY')

// Supabase session pooler — aceita JWT como password para o usuário postgres.{ref}
const configs = [
  { host: `aws-0-sa-east-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: serviceRole },
  { host: `aws-0-us-east-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: serviceRole },
  { host: `aws-0-us-west-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: serviceRole },
  { host: `aws-0-eu-west-1.pooler.supabase.com`, port: 5432, user: `postgres.${projectRef}`, password: serviceRole },
]

const SQL = `ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS respostas JSONB;`

let success = false

for (const cfg of configs) {
  const client = new Client({ ...cfg, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 5000 })
  try {
    console.log(`Tentando ${cfg.host}...`)
    await client.connect()
    await client.query(SQL)
    await client.end()
    console.log(`✅ Migration aplicada com sucesso via ${cfg.host}`)
    success = true
    break
  } catch (err) {
    console.log(`  ✗ ${err.message}`)
    try { await client.end() } catch {}
  }
}

if (!success) {
  console.log('\n❌ Não foi possível conectar automaticamente.')
  console.log('\nRode este SQL no Supabase SQL Editor (supabase.com → seu projeto → SQL Editor):')
  console.log('\n  ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS respostas JSONB;\n')
  process.exit(1)
}
