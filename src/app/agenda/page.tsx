import { redirect } from 'next/navigation'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import AgendaClient from './AgendaClient'

export default async function AgendaPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  if (user.user_metadata?.tipo === 'pai') redirect('/pais/perfil')

  const admin = createAdminClient()

  // Busca turmas do professor
  const { data: turmas } = await admin
    .from('turmas')
    .select('id, nome')
    .eq('professor_id', user.id)
    .order('nome')

  // Busca eventos dos próximos 3 meses + mês atual
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0]
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 0).toISOString().split('T')[0]

  const { data: eventos } = await admin
    .from('eventos')
    .select('id, turma_id, tipo, data, horario, local, observacao')
    .eq('professor_id', user.id)
    .gte('data', inicioMes)
    .lte('data', fimMes)
    .order('data')

  return (
    <AgendaClient
      turmas={turmas ?? []}
      eventosBanco={eventos ?? []}
      professorId={user.id}
    />
  )
}
