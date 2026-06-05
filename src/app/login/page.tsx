'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Area = 'atleta' | 'treinador' | null

const areas = [
  {
    id: 'atleta' as Area,
    icon: '⚡',
    title: 'Atleta',
    desc: 'Entre ou crie seu perfil de atleta',
    loginLabel: 'Entrar com ID',
    cadastroLabel: 'Criar perfil de atleta',
    cadastroHref: '/atleta/cadastro',
  },
  {
    id: 'treinador' as Area,
    icon: '👨‍🏫',
    title: 'Treinador',
    desc: 'Entre ou monte seu currículo',
    loginLabel: 'Entrar como treinador',
    cadastroLabel: 'Criar perfil de treinador',
    cadastroHref: '/treinador/cadastro',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [area, setArea] = useState<Area>(null)
  const [step, setStep] = useState<0 | 1 | 2>(0) // 0=escolha, 1=ação, 2=login
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // ── Se já há sessão ativa, redireciona sem mostrar o formulário ──
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

  // Enquanto verifica a sessão, não renderiza o formulário
  if (checking) return null

  const areaInfo = areas.find(a => a.id === area)

  function handleSelectArea(id: Area) {
    setArea(id)
    setStep(1)
    setError(null)
  }

  function handleBack() {
    if (step === 2) { setStep(1); setError(null) }
    else { setArea(null); setStep(0); setError(null) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (area === 'atleta' || area === 'treinador') {
      const raw       = identifier.trim().toUpperCase().replace(/\D/g, '').padStart(5, '0')
      const prefix    = area === 'atleta' ? 'MC' : 'TR'
      const athleteId = `${prefix}-${raw}`
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
      const { tipo } = await res.json() as { tipo: string }
      if (tipo === 'atleta' || area === 'atleta') {
        router.push('/atleta/perfil')
      } else {
        router.push('/treinador/dashboard')
      }
      return
    }

    const supabase = createClient()
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    })

    if (signInErr || !data.user) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    // ── Redirect por tipo — cada usuário entra no seu universo ──
    const tipo = (data.user.user_metadata as { tipo?: string })?.tipo ?? ''

    if (tipo === 'atleta') {
      router.push('/atleta/perfil')
    } else if (tipo === 'treinador' || tipo === 'escola') {
      router.push('/treinador/dashboard')
    } else {
      router.push('/treinador/dashboard')
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'system-ui, sans-serif',
    transition: 'border-color .2s, box-shadow .2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)', marginBottom: '8px',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      paddingTop: 'max(24px, env(safe-area-inset-top))',
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
      overscrollBehaviorY: 'none',
    }}>
      <style>{`
        /* Login — active press states */
        button:active  { transform:scale(.97); opacity:.88; transition:transform .08s,opacity .08s; }
        a[href]:active { opacity:.8; transition:opacity .1s; }
        input:focus    { border-color:rgba(0,255,136,0.3) !important; box-shadow:0 0 0 3px rgba(0,255,136,0.08) !important; outline:none; }
        select option  { background:#06100a; }
      `}</style>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
          </Link>
        </div>

        {/* ── STEP 0: escolha a área ── */}
        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                Quem é você no jogo?
              </h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {areas.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSelectArea(a.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '20px 22px', borderRadius: '16px', border: 'none',
                    background: 'rgba(255,255,255,0.04)',
                    outline: '1.5px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    minHeight: '72px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.outline = '1.5px solid rgba(0,255,136,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.outline = '1.5px solid rgba(255,255,255,0.1)')}
                >
                  <span style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: 'rgba(0,255,136,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                  }}>{a.icon}</span>
                  <div>
                    <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 800, color: 'white' }}>{a.title}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>{a.desc}</p>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.2)', fontSize: '18px' }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── STEP 1: entrar ou criar perfil ── */}
        {step === 1 && areaInfo && (
          <>
            <button onClick={handleBack} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600,
              marginBottom: '28px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              ← Voltar
            </button>

            {/* Badge área */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
              marginBottom: '28px',
            }}>
              <span style={{ fontSize: '18px' }}>{areaInfo.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{areaInfo.title}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Entrar */}
              <button
                onClick={() => setStep(2)}
                style={{
                  padding: '19px 22px', borderRadius: '14px', border: 'none',
                  background: '#00FF88', color: '#030805', fontWeight: 800,
                  fontSize: '15px', cursor: 'pointer', width: '100%',
                  boxShadow: '0 0 24px rgba(0,255,136,0.2)',
                  minHeight: '58px',
                  transition: 'transform .08s, opacity .1s',
                }}
              >
                {areaInfo.loginLabel} →
              </button>

              {/* Criar perfil — só para treinador */}
              {area === 'treinador' && (
                <Link
                  href={areaInfo.cadastroHref}
                  style={{
                    display: 'block', padding: '17px 22px', borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.65)', fontWeight: 700,
                    fontSize: '15px', textAlign: 'center', textDecoration: 'none',
                    minHeight: '58px', lineHeight: '24px',
                    transition: 'border-color .2s, background .2s',
                  }}
                >
                  {areaInfo.cadastroLabel}
                </Link>
              )}
            </div>
          </>
        )}

        {/* ── STEP 2: formulário de login ── */}
        {step === 2 && areaInfo && (
          <>
            <button onClick={handleBack} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: 600,
              marginBottom: '28px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              ← Voltar
            </button>

            {/* Badge área */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', borderRadius: '12px',
              background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)',
              marginBottom: '24px',
            }}>
              <span style={{ fontSize: '18px' }}>{areaInfo.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{areaInfo.title}</span>
            </div>

            <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              Bem-vindo de volta
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>
              Entre com seu ID e senha
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{area === 'atleta' ? 'ID do Atleta' : 'ID do Treinador'}</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Ex: 16138"
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                />
                {area === 'atleta' ? (
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                    <Link href="/atleta/recuperar-id" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                      Esqueceu o ID?
                    </Link>
                    {' · '}
                    <Link href="/atleta/recuperar-senha" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                      Esqueceu a senha?
                    </Link>
                  </p>
                ) : (
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                    <Link href="/treinador/recuperar-id" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                      Esqueceu o ID?
                    </Link>
                    {' · '}
                    <Link href="/treinador/recuperar-senha" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                      Esqueceu a senha?
                    </Link>
                  </p>
                )}
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
                  padding: '17px', borderRadius: '14px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: '#22c55e', color: 'black', fontWeight: 800,
                  fontSize: '16px', opacity: loading ? 0.6 : 1,
                  minHeight: '56px',
                  transition: 'transform .08s, opacity .15s',
                  boxShadow: '0 0 32px rgba(34,197,94,0.2)',
                }}
              >
                {loading ? 'Entrando…' : 'Entrar →'}
              </button>
            </form>
          </>
        )}

      </div>
    </main>
  )
}