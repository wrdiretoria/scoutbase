'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Area = 'atleta' | 'treinador'

export default function LoginPage() {
  const router = useRouter()
  const [area, setArea] = useState<Area>('atleta')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Se já tem sessão ativa, redireciona
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const tipo = (session.user.user_metadata as { tipo?: string })?.tipo ?? ''
        if (tipo === 'treinador' || tipo === 'escola') {
          router.replace('/treinador/dashboard')
        } else {
          router.replace('/atleta/perfil')
        }
      } else {
        setChecking(false)
      }
    })
  }, [router])

  // Ao trocar área, limpa os campos
  function handleArea(a: Area) {
    setArea(a)
    setIdentifier('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (area === 'atleta') {
      const raw = identifier.trim().toUpperCase().replace(/\D/g, '').padStart(5, '0')
      const athleteId = `MC-${raw}`
      const res = await fetch('/api/auth/signin-por-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setError(body.error === 'Credenciais incorretas.' ? 'Senha incorreta.' : 'ID não encontrado. Verifique e tente novamente.')
        setLoading(false)
        return
      }
      router.push('/atleta/perfil')
      return
    }

    // Treinador — login por ID (TR-XXXXX) ou email
    const raw = identifier.trim()
    const isId = !raw.includes('@')

    if (isId) {
      const digitos = raw.toUpperCase().replace(/\D/g, '').padStart(5, '0')
      const athleteId = `TR-${digitos}`
      const res = await fetch('/api/auth/signin-por-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId, password }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setError(body.error === 'Credenciais incorretas.' ? 'Senha incorreta.' : 'ID não encontrado. Verifique e tente novamente.')
        setLoading(false)
        return
      }
      router.push('/treinador/dashboard')
      return
    }

    const supabase = createClient()
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: raw,
      password,
    })
    if (signInErr || !data.user) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }
    const tipo = (data.user.user_metadata as { tipo?: string })?.tipo ?? ''
    if (tipo === 'atleta') {
      router.push('/atleta/perfil')
    } else {
      router.push('/treinador/dashboard')
    }
  }

  if (checking) return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '32px' }}>
          ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
        </div>
        <div style={{
          width: '36px', height: '36px', margin: '0 auto',
          border: '3px solid rgba(0,255,136,0.15)',
          borderTopColor: '#00ff87', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'system-ui, sans-serif',
    transition: 'border-color .2s, box-shadow .2s',
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      paddingTop: 'max(24px, env(safe-area-inset-top))',
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        input:focus { border-color:rgba(0,255,136,0.35) !important; box-shadow:0 0 0 3px rgba(0,255,136,0.08) !important; }
        button:active { transform:scale(.97); opacity:.88; transition:transform .08s,opacity .08s; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Link href="/" style={{ fontSize: '20px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
          </Link>
        </div>

        {/* Toggle Atleta / Treinador */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px', padding: '4px', marginBottom: '28px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['atleta', 'treinador'] as Area[]).map(a => (
            <button
              key={a}
              onClick={() => handleArea(a)}
              style={{
                flex: 1, padding: '10px', borderRadius: '9px', border: 'none',
                cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                fontSize: '14px', fontWeight: 700,
                background: area === a ? '#00FF88' : 'transparent',
                color: area === a ? '#030805' : 'rgba(255,255,255,0.4)',
                transition: 'all .2s',
              }}
            >
              {a === 'atleta' ? '⚡ Atleta' : '👨‍🏫 Treinador'}
            </button>
          ))}
        </div>

        {/* Título */}
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
          Bem-vindo de volta
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
          {area === 'atleta' ? 'Entre com seu ID e senha.' : 'Entre com seu ID ou email e senha.'}
        </p>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {area === 'atleta' ? 'ID do Atleta' : 'ID ou Email'}
            </label>
            <input
              key={area}
              type="text"
              required
              autoFocus
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder={area === 'atleta' ? 'Ex: 16138' : 'ID (ex: 00001) ou email'}
              style={{
                ...inputStyle,
                ...(area === 'atleta' ? { textTransform: 'uppercase', letterSpacing: '0.06em' } : {}),
              }}
            />
            {area === 'atleta' && (
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                <Link href="/atleta/recuperar-id" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
                  Esqueceu o ID?
                </Link>
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Senha
            </label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Sua senha" style={inputStyle}
            />
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
              <Link
                href={area === 'atleta' ? '/atleta/recuperar-senha' : '/treinador/recuperar-senha'}
                style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
              >
                Esqueceu a senha?
              </Link>
            </p>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: '13px', color: '#f87171',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              marginTop: '4px', padding: '16px', borderRadius: '14px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: '#00FF88', color: '#030805', fontWeight: 800,
              fontSize: '16px', opacity: loading ? 0.6 : 1,
              minHeight: '56px', boxShadow: '0 0 32px rgba(0,255,136,0.2)',
              transition: 'opacity .15s',
            }}
          >
            {loading ? 'Entrando…' : 'Entrar →'}
          </button>
        </form>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>NÃO TEM CONTA?</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Criar conta */}
        <Link
          href={area === 'atleta' ? '/atleta/cadastro' : '/treinador/cadastro'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '15px', borderRadius: '14px',
            border: '1.5px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(255,255,255,0.7)', fontSize: '15px', fontWeight: 700,
            textDecoration: 'none', textAlign: 'center',
            transition: 'border-color .2s, background .2s',
          }}
        >
          Criar conta {area === 'atleta' ? 'de atleta' : 'de treinador'} →
        </Link>

      </div>
    </main>
  )
}
