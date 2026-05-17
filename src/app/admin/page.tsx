import { redirect } from 'next/navigation'
import { createServerClient, createAdminClient } from '@/lib/supabase'
import AdminClient from './AdminClient'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'wrdiretoria@gmail.com'

export default async function AdminPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/login')

  const admin = createAdminClient()

  // ── Usuários cadastrados (auth) ──
  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const users = (usersData?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? '',
    nome: (u.user_metadata?.nome as string | undefined) ?? '',
    tipo: (u.user_metadata?.tipo as string | undefined) ?? 'professor',
    aluno_scout_id: (u.user_metadata?.aluno_scout_id as string | undefined) ?? null,
    aluno_nome: (u.user_metadata?.aluno_nome as string | undefined) ?? null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }))

  // ── Atletas ScoutBase ──
  const { data: atletas } = await admin
    .from('alunos')
    .select('id, nome, posicao, scout_id, ativo, professor_id, data_nascimento, turmas(nome)')
    .order('nome')

  // ── Avaliações (count total) ──
  const { count: totalAvaliacoes } = await admin
    .from('avaliacoes')
    .select('id', { count: 'exact', head: true })

  // ── Presenças (count) ──
  const { count: totalPresencas } = await admin
    .from('presencas')
    .select('id', { count: 'exact', head: true })

  // ── Meu Craque metrics ──
  const allUsers = usersData?.users ?? []
  const atletasMC     = allUsers.filter(u => u.user_metadata?.tipo === 'atleta').length
  const treinadoresMC = allUsers.filter(u => u.user_metadata?.tipo === 'treinador').length

  // Atletas MC com pelo menos 1 avaliação (unique aluno_id in profiles)
  const { data: profilesData } = await admin
    .from('profiles')
    .select('id')
    .not('athlete_id', 'is', null)

  let atletasAvaliados = 0
  const profileIds = (profilesData ?? []).map((p: { id: string }) => p.id)
  if (profileIds.length > 0) {
    const { data: avsCheck } = await admin
      .from('avaliacoes')
      .select('aluno_id')
      .in('aluno_id', profileIds)
    const uniqueAvaliados = new Set((avsCheck ?? []).map((a: { aluno_id: string }) => a.aluno_id))
    atletasAvaliados = uniqueAvaliados.size
  }

  const stats = {
    totalUsuarios: users.length,
    totalAtletas: atletas?.length ?? 0,
    totalAvaliacoes: totalAvaliacoes ?? 0,
    totalPresencas: totalPresencas ?? 0,
    professores: users.filter((u) => u.tipo !== 'pai').length,
    responsaveis: users.filter((u) => u.tipo === 'pai').length,
    // Meu Craque
    atletasMC,
    treinadoresMC,
    atletasAvaliados,
  }

  return (
    <AdminClient
      users={users}
      atletas={atletas ?? []}
      stats={stats}
    />
  )
}
