'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Area = 'atleta' | 'escola' | null

export default function LoginPage() {
  const router = useRouter()
  const [area, setArea] = useState<Area>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password })

    if (signInErr || !data.user) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    const tipo = (data.user.user_metadata as { tipo?: string })?.tipo
    if (tipo === 'atleta') router.push('/atleta/perfil')
    else if (tipo === 'scout') router.push('/scout/busca')
    else router.push('/dashboard')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '15px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)', marginBottom: '8px',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.03em' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </Link>
        </div>

        {/* ── STEP 1: escolha da área ── */}
        {!area && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                Qual é a sua área?
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                Escolha para continuar
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Atleta e Responsável */}
              <button
                onClick={() => setArea('atleta')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '18px',
                  padding: '22px 24px', borderRadius: '16px', border: 'none',
                  background: 'rgba(255,255,255,0.04)',
                  outline: '1.5px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.outline = '1.5px solid rgba(0,255,136,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.outline = '1.5px solid rgba(255,255,255,0.1)')}
              >
                <span style={{
                  width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(0,255,136,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                }}>⚡</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'white' }}>
                    Atleta e Responsável
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                    Acesse seu perfil, acompanhe a evolução e conquistas
                  </p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: '18px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>›</span>
              </button>

              {/* Minha Escola de Futebol */}
              <button
                onClick={() => setArea('escola')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '18px',
                  padding: '22px 24px', borderRadius: '16px', border: 'none',
                  background: 'rgba(255,255,255,0.04)',
                  outline: '1.5px solid rgba(255,255,255,0.1)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.outline = '1.5px solid rgba(0,255,136,0.5)')}
                onMouseLeave={e => (e.currentTarget.style.outline = '1.5px solid rgba(255,255,255,0.1)')}
              >
                <span style={{
                  width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
                  background: 'rgba(0,255,136,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                }}>🏟️</span>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: 'white' }}>
                    Minha Escola de Futebol
                  </p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                    Gerencie turmas, atletas e avaliações da sua escolinha
                  </p>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: '18px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>›</span>
              </button>

            </div>

            <p style={{ marginTop: '28px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
              Ainda não tem conta?{' '}
              <Link href="/cadastro" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>
                Criar perfil grátis
              </Link>
            </p>
          </>
        )}

        {/* ── STEP 2: formulário de login ── */}
        {area && (
          <>
            {/* Voltar */}
            <button
              onClick={() => { setArea(null); setError(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600,
                marginBottom: '28px', padding: 0,
              }}
            >
              ← Voltar
            </button>

            {/* Área selecionada */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
              marginBottom: '28px',
            }}>
              <span style={{ fontSize: '18px' }}>{area === 'atleta' ? '⚡' : '🏟️'}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                {area === 'atleta' ? 'Atleta e Responsável' : 'Minha Escola de Futebol'}
              </span>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                Bem-vindo de volta
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
                Entre com seu email e senha
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Senha</label>
                <input
                  type="password" required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha" style={inputStyle}
                />
              </div>

              {error && (
                <p style={{
                  margin: 0, padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: '13px', color: '#f87171',
                }}>
                  {error}
                </p>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  padding: '14px', borderRadius: '14px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: '#22c55e', color: 'black', fontWeight: 800,
                  fontSize: '16px', opacity: loading ? 0.6 : 1, marginTop: '4px',
                }}
              >
                {loading ? 'Entrando…' : 'Entrar →'}
              </button>
            </form>

            <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
              Ainda não tem conta?{' '}
              <Link href="/cadastro" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>
                Criar perfil grátis
              </Link>
            </p>
          </>
        )}

      </div>
    </main>
  )
}
