'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
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
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.03em' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </Link>
          <h1 style={{ margin: '20px 0 6px', fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            Bem-vindo de volta
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            Entre para acessar seu perfil
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
      </div>
    </main>
  )
}
