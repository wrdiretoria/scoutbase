/**
 * /clube/[id] — página pública da instituição/escolinha de um treinador.
 * [id] é o profile id do treinador — não existe tipo de conta "clube"
 * separado, club_id é sempre o auth.uid() do próprio treinador logado.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import CandidatarButton from '@/components/CandidatarButton'

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!isUuid(id)) return { title: 'Clube | Meu Craque' }
  try {
    const admin = createAdminClient()
    const { data: { user } } = await admin.auth.admin.getUserById(id)
    const nome = (user?.user_metadata?.nome as string | undefined) ?? 'Clube'
    return { title: `${nome} | Meu Craque`, description: `Vagas abertas de ${nome} no Meu Craque.` }
  } catch {
    return { title: 'Clube | Meu Craque' }
  }
}

export default async function ClubePage({ params }: Props) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const admin = createAdminClient()

  let user: Awaited<ReturnType<typeof admin.auth.admin.getUserById>>['data']['user']
  try {
    const res = await admin.auth.admin.getUserById(id)
    if (res.error || !res.data.user) notFound()
    user = res.data.user
  } catch {
    notFound()
  }

  const meta = user.user_metadata as {
    nome?: string; cidade?: string; tipo?: string
    categoria_trabalho?: string; especialidade?: string
    clube_atual?: string
  }

  const { data: profileData } = await admin
    .from('profiles')
    .select('avatar_url, athlete_id')
    .eq('id', id)
    .maybeSingle()

  const athleteIdRaw = (profileData?.athlete_id as string | null) ?? null
  const isTrainer = meta.tipo === 'treinador' || meta.tipo === 'escola' || athleteIdRaw?.startsWith('TR-')
  if (!isTrainer) notFound()

  const nome         = meta.nome ?? 'Clube'
  const cidade       = meta.cidade ?? null
  const especialidade = meta.categoria_trabalho ?? meta.especialidade ?? null
  const clubeAtual   = meta.clube_atual ?? null
  const avatarUrl    = (profileData?.avatar_url as string | null) ?? null
  const initials     = getInitials(nome)

  const { data: vagas } = await admin
    .from('opportunities')
    .select('id, title, position, category, city, description, created_at')
    .eq('club_id', id)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <Link
          href={`/treinador/${id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px',
            fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
            padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          ← Ver perfil de {nome}
        </Link>

        {/* Cabeçalho */}
        <div style={{
          padding: '24px', borderRadius: '20px', marginBottom: '24px',
          background: 'linear-gradient(135deg,#052e16,#071a0e)',
          border: '1px solid rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0,
            background: 'linear-gradient(135deg,#15803d,#4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px', fontWeight: 900, overflow: 'hidden',
          }}>
            {avatarUrl
              ? // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 2px', fontSize: '9px', fontWeight: 800, color: '#22c55e', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              🏟 Clube / Escolinha
            </p>
            <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900 }}>{nome}</h1>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {cidade && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>📍 {cidade}</span>}
              {especialidade && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>⚡ {especialidade}</span>}
              {clubeAtual && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>⚽ {clubeAtual}</span>}
            </div>
          </div>
        </div>

        {/* Vagas abertas */}
        <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          💼 Vagas abertas
        </p>

        {(vagas ?? []).length === 0 ? (
          <div style={{
            padding: '24px', borderRadius: '16px', textAlign: 'center',
            background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
              Nenhuma vaga aberta no momento.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(vagas ?? []).map(v => (
              <div key={v.id} style={{
                background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '16px',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: 'white' }}>{v.title}</p>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                  {[v.position, v.category, v.city].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}
                </p>
                {v.description && (
                  <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                    {v.description}
                  </p>
                )}
                <CandidatarButton opportunityId={v.id} />
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  )
}
