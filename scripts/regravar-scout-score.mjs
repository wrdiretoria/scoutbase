/**
 * Regrava avaliacoes.scout_score a partir das respostas, pela regra atual
 * (lib/escala.ts → notaDaAvaliacao: Técnico 35% · Físico 25% · Tático 25% · Comportamento 15%).
 *
 * Padrão = simulação (não grava nada). Antes de qualquer escrita salva backup
 * em scripts/backup_scout_score_<data>.json (id, aluno_id, scout_score antigo).
 *
 * Uso:
 *   node --env-file=.env.local scripts/regravar-scout-score.mjs <aluno_uuid> [...]          # simulação
 *   node --env-file=.env.local scripts/regravar-scout-score.mjs --apply <aluno_uuid> [...]  # grava
 *
 * Para voltar: use o backup e grave o scout_score antigo de volta em cada id.
 */
import { createClient } from '@supabase/supabase-js'
import { createJiti } from 'jiti'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const jiti = createJiti(import.meta.url, { alias: { '@': path.join(dir, '..', 'src') } })
const { notaDaAvaliacao } = await jiti.import('../src/lib/escala.ts')

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const alunos = args.filter(a => a !== '--apply')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ex: --env-file=.env.local)')
  process.exit(1)
}
if (alunos.length === 0) { console.error('Informe ao menos um aluno_id'); process.exit(1) }

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const { data: avs, error } = await admin
  .from('avaliacoes')
  .select('id, aluno_id, scout_score, respostas, variante')
  .in('aluno_id', alunos)
  .not('respostas', 'is', null)
if (error) { console.error('Erro ao ler avaliações:', error.message); process.exit(1) }

const linhas = avs.map(av => ({ id: av.id, aluno_id: av.aluno_id, antes: av.scout_score, depois: notaDaAvaliacao(av) }))
console.table(linhas)

// Backup nunca sobrescreve um anterior (o primeiro guarda os valores originais)
const data = new Date().toISOString().slice(0, 10)
let backupPath = path.join(dir, `backup_scout_score_${data}.json`)
for (let n = 2; existsSync(backupPath); n++) backupPath = path.join(dir, `backup_scout_score_${data}_${n}.json`)
writeFileSync(backupPath, JSON.stringify(avs.map(a => ({ id: a.id, aluno_id: a.aluno_id, scout_score: a.scout_score })), null, 2))
console.log('Backup salvo em', path.relative(process.cwd(), backupPath))

if (!apply) {
  console.log('\nSimulação — nada foi gravado. Rode com --apply para gravar.')
} else {
  for (const l of linhas) {
    if (l.depois === null || l.depois === l.antes) continue
    const { error: upErr } = await admin.from('avaliacoes').update({ scout_score: l.depois }).eq('id', l.id)
    console.log(upErr ? `✗ ${l.id}: ${upErr.message}` : `✓ ${l.id}: ${l.antes} → ${l.depois}`)
  }
}
