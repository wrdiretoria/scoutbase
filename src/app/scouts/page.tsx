/**
 * /scouts — Lista pública de scouts cadastrados na plataforma
 * Server Component — busca via admin client (bypass RLS)
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

export default async function ScoutsPage() {
  const admin = createAdminClient()

  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) notFound()

  const scouts = users
    .filter(u => u.user_metadata?.tipo === 'scout' && u.user_metadata?.nome)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(u => ({
      id:          u.id,
      nome:        u.user_metadata.nome as string,
      organizacao: (u.user_metadata.organizacao as string | null) ?? null,
      email:       u.email ?? null,
      initials:    getInitials(u.user_metadata.nome as string),
    }))

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
    }}>
      {/* Nav */}
      <nav style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: '#06100a', zIndex: 10,
      }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.01em' }}>
          ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
        </Link>
        <Link href="/scout/cadastro" style={{
          padding: '8px 16px', borderRadius: '10px', background: '#22c55e',
          color: 'black', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
        }}>
          + Sou scout
        </Link>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            🔍 Rede de Scouts
          </p>
          <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Scouts na plataforma
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {scouts.length} scout{scouts.length !== 1 ? 's' : ''} cadastrado{scouts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {scouts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🔍</p>
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhum scout cadastrado ainda.</p>
            </div>
          )}

          {scouts.map(scout => (
            <div
              key={scout.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg,#1e3a5f,#3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 900, color: 'white',
              }}>
                {scout.initials}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scout.nome}
                </p>
                {scout.organizacao && (
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    {scout.organizacao}
                  </p>
                )}
              </div>

              {/* Contato */}
              {scout.email && (
                <a
                  href={`mailto:${scout.email}`}
                  style={{
                    padding: '7px 14px', borderRadius: '10px',
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                    color: '#22c55e', fontSize: '12px', fontWeight: 700,
                    textDecoration: 'none', flexShrink: 0,
                  }}
                >
                  Contato
                </a>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '40px', padding: '24px', borderRadius: '20px',
          background: 'linear-gradient(135deg,#052e16,#0b1610)',
          border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 900 }}>
            Você é scout?
          </p>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Cadastre-se e descubra os melhores talentos do país.
          </p>
          <Link href="/scout/cadastro" style={{
            display: 'inline-block', padding: '13px 32px', borderRadius: '14px',
            background: '#22c55e', color: 'black', fontWeight: 800,
            fontSize: '15px', textDecoration: 'none',
          }}>
            Entrar como scout →
          </Link>
        </div>
      </div>
    </main>
  )
}
