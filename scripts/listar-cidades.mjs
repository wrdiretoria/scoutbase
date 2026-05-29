import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://gmlmmhdiuzumdjhnppha.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtbG1taGRpdXp1bWRqaG5wcGhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njk3ODEyMiwiZXhwIjoyMDkyNTU0MTIyfQ.W5T3XASDe_b3RnIjIjMU-FW0WzeLJuE_Xp9xvLvccnc'

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
