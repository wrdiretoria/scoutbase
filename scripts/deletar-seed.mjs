import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gmlmmhdiuzumdjhnppha.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbG1taGRpdXp1bWRqaG5wcGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk3ODEyMiwiZXhwIjoyMDkyNTU0MTIyfQ.W5T3XASDe_b3RnIjIjMU-FW0WzeLJuE_Xp9xvLvccnc'

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
