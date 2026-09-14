/**
 * /feed — feed da rede do usuário logado (qualquer tipo de conta).
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { getNetworkStats } from '@/lib/network-stats'
import FeedCenter from './FeedCenter'
import QuickConnectButton from './QuickConnectButton'

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function roleLabel(tipo: string | undefined, posicao: string | undefined) {
  if (tipo === 'atleta')    return posicao?.trim() || 'Atleta'
  if (tipo === 'treinador') return 'Treinador'
  if (tipo === 'scout')     return 'Scout'
  if (tipo === 'clube')     return 'Clube'
  return tipo ?? ''
}

const NAV_ITEMS = [
  { href: '/feed',        icon: '🏠', label: 'Feed' },
  { href: '/minha-rede',  icon: '🕸️', label: 'Minha Rede' },
  { href: '/vagas',       icon: '💼', label: 'Vagas' },
  { href: '/mensagens',   icon: '✉️', label: 'Mensagens' },
]

const CARD_STYLE: CSSProperties = {
  background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '16px', padding: '16px',
}

export default async function FeedPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: profile }, stats] = await Promise.all([
    admin.from('profiles').select('nome, avatar_url').eq('id', user.id).maybeSingle(),
    getNetworkStats(admin, user.id, user.id),
  ])

  const nome    = (profile?.nome as string | null) ?? (user.user_metadata?.nome as string | undefined) ?? 'Você'
  const avatar  = (profile?.avatar_url as string | null) ?? null
  const tipo    = user.user_metadata?.tipo as string | undefined
  const posicao = user.user_metadata?.posicao as string | undefined

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{
        maxWidth: '1120px', margin: '0 auto', padding: '20px 16px 60px',
        display: 'grid', gridTemplateColumns: 'minmax(0,240px) minmax(0,600px) minmax(0,280px)',
        gap: '20px', alignItems: 'start',
      }}>

        {/* ── Sidebar esquerda ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
          <div style={CARD_STYLE}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt={nome} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: '56px', height: '56px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#15803d,#4ade80)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 900, color: 'white',
                }}>
                  {getInitials(nome)}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'white' }}>{nome}</p>
                {roleLabel(tipo, posicao) && (
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>
                    {roleLabel(tipo, posicao)}
                  </p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#22c55e' }}>{stats.connections}</p>
                <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Conexões</p>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#22c55e' }}>{stats.viewsLast30Days ?? 0}</p>
                <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Views (30d)</p>
              </div>
            </div>
          </div>

          <nav style={{ ...CARD_STYLE, padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {NAV_ITEMS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px',
                  textDecoration: 'none', fontSize: '13px', fontWeight: 700,
                  color: item.href === '/feed' ? '#22c55e' : 'rgba(255,255,255,0.6)',
                  background: item.href === '/feed' ? 'rgba(34,197,94,0.1)' : 'transparent',
                }}
              >
                <span style={{ fontSize: '15px' }}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* ── Centro: composer + feed ── */}
        <section>
          <FeedCenter cardStyle={CARD_STYLE} />
        </section>

        {/* ── Sidebar direita ── */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
          <div style={CARD_STYLE}>
            <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Pessoas que você pode conhecer
            </p>
            <QuickConnectButton />
          </div>

          <div style={CARD_STYLE}>
            <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Oportunidades em destaque
            </p>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              Nenhuma oportunidade publicada ainda.
            </p>
          </div>
        </aside>

      </div>
    </main>
  )
}
