/**
 * /vagas — mural público de vagas abertas (atletas navegam sem precisar
 * estar logados; candidatar-se exige login).
 */
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import CandidatarButton from '@/components/CandidatarButton'
import VagasFiltros from './VagasFiltros'

type Props = { searchParams: Promise<{ position?: string; category?: string; city?: string }> }

export default async function VagasPage({ searchParams }: Props) {
  const { position, category, city } = await searchParams

  const admin = createAdminClient()
  let query = admin
    .from('opportunities')
    .select('id, club_id, title, position, category, city, description, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (position) query = query.eq('position', position)
  if (category) query = query.eq('category', category)
  if (city)     query = query.ilike('city', `%${city}%`)

  const { data: vagas } = await query

  const rows = vagas ?? []
  const clubIds = Array.from(new Set(rows.map(v => v.club_id)))
  const { data: clubes } = clubIds.length > 0
    ? await admin.from('profiles').select('id, nome, avatar_url').in('id', clubIds)
    : { data: [] as { id: string; nome: string | null; avatar_url: string | null }[] }
  const clubePorId = new Map((clubes ?? []).map(c => [c.id, { nome: c.nome, avatarUrl: c.avatar_url }]))

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link href="/" style={{ fontSize: '14px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
          </Link>
        </div>

        <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900 }}>💼 Vagas abertas</h1>
        <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
          Oportunidades publicadas por treinadores e escolinhas no Meu Craque.
        </p>

        <VagasFiltros positionFiltro={position} categoryFiltro={category} cityFiltro={city} />

        {rows.length === 0 ? (
          <div style={{
            padding: '32px', borderRadius: '16px', textAlign: 'center',
            background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
              Nenhuma vaga encontrada com esses filtros.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {rows.map(v => {
              const clube = clubePorId.get(v.club_id)
              return (
                <div key={v.id} style={{
                  background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', padding: '16px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'white' }}>{v.title}</p>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                    {[v.position, v.category, v.city].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}
                  </p>
                  {clube?.nome && (
                    <Link href={`/clube/${v.club_id}`} style={{ fontSize: '12px', color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>
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
