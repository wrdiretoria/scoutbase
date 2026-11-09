/**
 * /vagas — mural público de vagas abertas (atletas navegam sem precisar
 * estar logados; candidatar-se exige login).
 */
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import CandidatarButton from '@/components/CandidatarButton'
import VagasFiltros from './VagasFiltros'

type Props = { searchParams: Promise<{ position?: string; category?: string; city?: string; aba?: string }> }

export default async function VagasPage({ searchParams }: Props) {
  const { position, category, city, aba } = await searchParams

  const admin = createAdminClient()
  const minhas = aba === 'candidaturas'
  const filtrando = Boolean(position || category || city)
  const cabecalho = (
    <header style={{ display: 'flex', alignItems: 'center', minHeight: 48, marginBottom: 16, borderBottom: '1px solid #304239' }}>
      <Link href="/" aria-label="MeuCraque, página inicial" style={{ fontSize: 14, fontWeight: 800, color: 'white', textDecoration: 'none' }}>
        ⚽ <span style={{ color: 'var(--mc-accent)' }}>MEUCRAQUE</span>.com
      </Link>
    </header>
  )
  if (minhas) {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login?next=%2Fvagas%3Faba%3Dcandidaturas')
    const { data: candidaturas, error } = await admin.from('opportunity_applications')
      .select('id, opportunity_id, status, created_at').eq('athlete_id', user.id).order('created_at', { ascending: false })
    const ids = (candidaturas ?? []).map(item => item.opportunity_id)
    const vagas = ids.length ? await admin.from('opportunities').select('id, title').in('id', ids) : null
    const nomes = new Map((vagas?.data ?? []).map(vaga => [vaga.id, vaga.title]))
    const status: Record<string, string> = { pending: 'Enviada', viewed: 'Visualizada', accepted: 'Aceita', rejected: 'Não selecionada' }
    return (
      <main className="mc-screen" style={{ maxWidth: 600, margin: '0 auto', padding: '24px 20px 64px', color: '#f0f6f1' }}>
        {cabecalho}
        <Link href="/vagas" style={{ color: '#b3f737' }}>← Ver vagas abertas</Link>
        <h1 style={{ fontSize: 30, margin: '16px 0' }}>Minhas candidaturas</h1>
        {error || vagas?.error ? <p>Não foi possível carregar suas candidaturas agora.</p>
          : !candidaturas?.length ? <p>Você ainda não se candidatou a uma vaga.</p>
          : <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 12 }}>
              {candidaturas.map(item => (
                <li key={item.id} style={{ padding: 16, border: '1px solid #385346', borderRadius: 14, background: '#121f18' }}>
                  <strong>{nomes.get(item.opportunity_id) ?? 'Oportunidade indisponível'}</strong>
                  <p style={{ margin: '6px 0 0', color: 'var(--mc-muted)' }}>
                    {status[item.status] ?? 'Enviada'} · {new Date(item.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </p>
                </li>
              ))}
            </ul>}
      </main>
    )
  }

  let query = admin
    .from('opportunities')
    .select('id, club_id, title, position, category, city, description, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (position) query = query.eq('position', position)
  if (category) query = query.eq('category', category)
  if (city)     query = query.ilike('city', `%${city}%`)

  const { data: vagas, error: vagasError } = await query

  const rows = vagas ?? []
  const clubIds = Array.from(new Set(rows.map(v => v.club_id)))
  const { data: clubes } = clubIds.length > 0
    ? await admin.from('profiles').select('id, nome, avatar_url').in('id', clubIds)
    : { data: [] as { id: string; nome: string | null; avatar_url: string | null }[] }
  const clubePorId = new Map((clubes ?? []).map(c => [c.id, { nome: c.nome, avatarUrl: c.avatar_url }]))

  return (
    <main className="mc-screen" style={{ background: 'var(--mc-canvas)', minHeight: '100vh',  color: 'white', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {cabecalho}
        <h1 style={{ margin: '0 0 16px', fontSize: 26, fontWeight: 900 }}>Oportunidades</h1>

        <nav aria-label="Oportunidades" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Link aria-current="page" href="/vagas" style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--mc-accent)', color: 'var(--mc-on-accent)', fontWeight: 800 }}>Vagas abertas</Link>
          <Link href="/vagas?aba=candidaturas" style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #526458', color: '#f0f6f1' }}>Minhas candidaturas</Link>
        </nav>
        {!vagasError && (rows.length > 0 || filtrando) && (
          <VagasFiltros positionFiltro={position} categoryFiltro={category} cityFiltro={city} />
        )}

        {rows.length === 0 ? (
          <div style={{
            padding: '16px', borderRadius: '14px',
            background: 'var(--mc-surface)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--mc-muted)' }}>
              {vagasError ? 'Não foi possível carregar as vagas agora.' : filtrando ? 'Nenhuma vaga corresponde aos filtros.' : 'Nenhuma vaga aberta no momento.'}
            </p>
            {!vagasError && filtrando && <Link href="/vagas" style={{ display: 'inline-block', marginTop: 10, color: 'var(--mc-accent)' }}>Limpar filtros</Link>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rows.map(v => {
              const clube = clubePorId.get(v.club_id)
              return (
                <div key={v.id} style={{
                  background: 'var(--mc-surface)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', padding: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'white' }}>{v.title}</p>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'var(--mc-muted)' }}>
                    {[v.position, v.category, v.city].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}
                  </p>
                  {clube?.nome && (
                    <Link href={`/clube/${v.club_id}`} style={{ fontSize: '12px', color: '#b3f737', textDecoration: 'none', fontWeight: 700 }}>
                      🏟 {clube.nome}
                    </Link>
                  )}
                  {v.description && (
                    <p style={{ margin: '10px 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                      {v.description}
                    </p>
                  )}
                  <div style={{ marginTop: '10px' }}>
                    <CandidatarButton opportunityId={v.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}
