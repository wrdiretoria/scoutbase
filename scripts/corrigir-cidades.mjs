import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gmlmmhdiuzumdjhnppha.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbG1taGRpdXp1bWRqaG5wcGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk3ODEyMiwiZXhwIjoyMDkyNTU0MTIyfQ.W5T3XASDe_b3RnIjIjMU-FW0WzeLJuE_Xp9xvLvccnc'

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
