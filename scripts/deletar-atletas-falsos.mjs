import { createClient } from '@supabase/supabase-js'

// Credenciais via ambiente — nunca hardcodar a service role key
// Uso: node --env-file=.env.local scripts/deletar-atletas-falsos.mjs
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ex: --env-file=.env.local)')
  process.exit(1)
}

const MANTER = ['Pedro Torres', 'Brenda Silva']

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // 1. Busca perfis a deletar
  // Busca IDs que têm avaliação
  const { data: avs } = await admin
    .from('avaliacoes')
    .select('aluno_id')
    .not('scout_score', 'is', null)
  const idsComAvaliacao = [...new Set((avs ?? []).map(a => a.aluno_id))]

  const { data: perfis, error: perfisErr } = await admin
    .from('profiles')
    .select('id, nome, athlete_id')
    .like('athlete_id', 'MC-%')
    .not('nome', 'in', `(${MANTER.map(n => `"${n}"`).join(',')})`)
    .in('id', idsComAvaliacao)

  if (perfisErr) { console.error('Erro ao buscar perfis:', perfisErr); process.exit(1) }
  if (!perfis?.length) { console.log('Nenhum perfil para deletar.'); return }

  console.log(`\nDeletando ${perfis.length} atletas falsos:`)
  perfis.forEach(p => console.log(` - ${p.nome} (${p.athlete_id})`))

  const ids = perfis.map(p => p.id)

  // 2. Deleta avaliações
  const { error: avErr } = await admin.from('avaliacoes').delete().in('aluno_id', ids)
  if (avErr) console.error('Erro avaliações:', avErr)
  else console.log('\n✓ Avaliações deletadas')

  // 3. Deleta visitas
  const { error: visErr } = await admin.from('visitas').delete().in('atleta_id', ids)
  if (visErr) console.error('Erro visitas:', visErr)
  else console.log('✓ Visitas deletadas')

  // 4. Deleta perfis
  const { error: profErr } = await admin.from('profiles').delete().in('id', ids)
  if (profErr) console.error('Erro perfis:', profErr)
  else console.log('✓ Perfis deletados')

  // 5. Deleta usuários do Auth
  let authOk = 0
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) console.error(`Erro auth user ${id}:`, error.message)
    else authOk++
  }
  console.log(`✓ ${authOk}/${ids.length} usuários Auth deletados`)

  console.log('\nConcluído.')
}

main()
