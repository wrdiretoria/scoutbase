/**
 * seed-fotos.mjs
 * Adiciona URLs de fotos placeholder (Unsplash) nos atletas sem avatar_url.
 * Não sobrescreve atletas que já têm foto.
 *
 * Uso: node scripts/seed-fotos.mjs
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

const admin = createClient(SUPABASE_URL, SERVICE_KEY)

// Pool de fotos de futebol do Unsplash (placeholder realista)
// Formato: images.unsplash.com/photo-{ID}?w=400&h=500&q=80&fit=crop&crop=faces,center
const FOTO_POOL = [
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=500&q=80&fit=crop&crop=faces,center',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=500&q=80&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1511886929836-e781e5e66f2b?w=400&h=500&q=80&fit=crop&crop=faces,center',
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=400&h=500&q=80&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&h=500&q=80&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=500&q=80&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1504275107627-0c2ba7a43dba?w=400&h=500&q=80&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1551958219-acbc595d66ca?w=400&h=500&q=80&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?w=400&h=500&q=80&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1486286701208-1d58e9338013?w=400&h=500&q=80&fit=crop&crop=center',
]

// ── Busca atletas ─────────────────────────────────────────────────────────────
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
const atletas = users.filter(u => u.user_metadata?.tipo === 'atleta')
const ids = atletas.map(u => u.id)

const { data: profiles } = await admin
  .from('profiles')
  .select('id, avatar_url, nome')
  .in('id', ids)

const semFoto = (profiles ?? []).filter(p => !p.avatar_url)

if (semFoto.length === 0) {
  console.log('Todos os atletas já têm foto. Nada a fazer.')
  process.exit(0)
}

console.log(`\nAtletas sem foto: ${semFoto.length}`)
console.log(`Pool de placeholders: ${FOTO_POOL.length} fotos\n`)

let atualizados = 0
const erros = []

for (let i = 0; i < semFoto.length; i++) {
  const p = semFoto[i]
  const foto = FOTO_POOL[i % FOTO_POOL.length]  // cicla o pool

  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: foto })
    .eq('id', p.id)

  if (error) {
    erros.push({ id: p.id, nome: p.nome, erro: error.message })
    console.log(`  ✗ ${(p.nome ?? '—').padEnd(28)} → ERRO: ${error.message}`)
  } else {
    atualizados++
    console.log(`  ✓ ${(p.nome ?? '—').padEnd(28)} → placeholder ${i % FOTO_POOL.length + 1}`)
  }
}

console.log(`\n${atualizados} de ${semFoto.length} atletas atualizados.`)
if (erros.length > 0) {
  console.log(`\nErros (${erros.length}):`)
  for (const e of erros) console.log(`  ${e.nome}: ${e.erro}`)
}

console.log('\n⚠️  Atenção: verifique as URLs do Unsplash antes de usar em produção.')
console.log('   Para fotos reais, peça aos atletas que façam upload no perfil.')
