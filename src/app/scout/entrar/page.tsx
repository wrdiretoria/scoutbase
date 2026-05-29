'use client'

/**
 * /scout/entrar — Login para scouts já cadastrados.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function ScoutEntrarPage() {
  const router  = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err || !data.user) {
      setError('Email ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }
    // Verifica se é scout
    if (data.user.user_metadata?.tipo !== 'scout') {
      await supabase.auth.signOut()
      setError('Esta conta não é de scout. Use o login correto para atletas ou treinadores.')
      setLoading(false)
      return
    }
    router.push('/scout/dashboard')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 20px 40px',
    }}>
      <style>{`
        input:focus { border-color: rgba(251,191,36,0.4) !important; box-shadow: 0 0 0 3px rgba(251,191,36,0.08) !important; }
        .submit-btn:active { transform: scale(.98); opacity: .88; }
      `}</style>

      {/* Nav */}
      <nav style={{
        width: '100%', maxWidth: 420, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(20px + env(safe-area-inset-top)) 0 28px',
      }}>
        <Link href="/scout/busca" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
          ← Busca
        </Link>
        <Link href="/" style={{ fontSize: '15px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
          ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
        </Link>
        <div style={{ width: 60 }} />
      </nav>

      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>
            🔍
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>
            Entrar como scout
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Acesse sua conta para salvar atletas e usar filtros avançados
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              Senha
            </label>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 13, color: '#fca5a5',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
            style={{
              marginTop: 4, padding: '14px', borderRadius: 14, border: 'none',
              background: loading ? 'rgba(251,191,36,0.4)' : '#fbbf24',
              color: loading ? 'rgba(0,0,0,0.5)' : 'black',
              fontWeight: 900, fontSize: 16, cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'system-ui, sans-serif', transition: 'background .2s',
            }}
          >
            {loading ? 'Entrando…' : 'Entrar →'}
          </button>
        </form>

        {/* Links */}
        <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            Não tem conta?{' '}
            <Link href="/scout/cadastro" style={{ color: '#fbbf24', fontWeight: 700, textDecoration: 'none' }}>
              Criar conta grátis →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
