'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Area = 'atleta' | 'treinador' | 'escola' | null

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
  {
    id: 'escola' as Area,
    icon: '🏟️',
    title: 'Minha Escola',
    desc: 'Entre ou cadastre sua escola',
    loginLabel: 'Entrar como dono',
    cadastroLabel: 'Cadastrar minha escola',
    cadastroHref: '/treinador/cadastro?tipo=escola',
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

    let emailParaLogin = identifier

    if (area === 'atleta') {
      const res = await fetch('/api/auth/buscar-por-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: identifier }),
      })
      if (!res.ok) {
        setError('ID não encontrado. Verifique e tente novamente.')
        setLoading(false)
        return
      }
      const { email } = await res.json() as { email: string }
      emailParaLogin = email
    }

    const supabase = createClient()
    const { data, error: signInErr } = await supabase.auth.signInWithPassword({
      email: emailParaLogin,
      password,
    })

    if (signInErr || !data.user) {
      setError(area === 'atleta' ? 'Senha incorreta.' : 'Email ou senha incorretos.')
      setLoading(false)
      return
    }

    const tipo = (data.user.user_metadata as { tipo?: string })?.tipo
    if (tipo === 'atleta') router.push('/atleta/perfil')
    else if (tipo === 'treinador') router.push('/treinador/perfil')
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
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
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
                  padding: '18px 22px', borderRadius: '14px', border: 'none',
                  background: '#00FF88', color: '#030805', fontWeight: 800,
                  fontSize: '15px', cursor: 'pointer', width: '100%',
                  boxShadow: '0 0 24px rgba(0,255,136,0.2)',
                }}
              >
                {areaInfo.loginLabel} →
              </button>

              {/* Criar perfil */}
              <Link
                href={areaInfo.cadastroHref}
                style={{
                  display: 'block', padding: '18px 22px', borderRadius: '14px',
                  border: '1.5px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)', fontWeight: 700,
                  fontSize: '15px', textDecoration: 'none', textAlign: 'center',
                }}
              >
                {areaInfo.cadastroLabel}
              </Link>
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
              {area === 'atleta' ? 'Entre com seu ID e senha' : 'Entre com seu email e senha'}
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>{area === 'atleta' ? 'ID do Atleta' : 'Email'}</label>
                <input
                  type={area === 'atleta' ? 'text' : 'email'}
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={area === 'atleta' ? 'Ex: MC-00123' : 'seu@email.com'}
                  style={{ ...inputStyle, textTransform: area === 'atleta' ? 'uppercase' : 'none' }}
                />
                {area === 'atleta' && (
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                    <Link href="/atleta/recuperar-id" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
                      Esqueceu o ID?
                    </Link>
                    {' · '}
                    <Link href="/atleta/recuperar-senha" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
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
                  padding: '14px', borderRadius: '14px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: '#22c55e', color: 'black', fontWeight: 800,
                  fontSize: '16px', opacity: loading ? 0.6 : 1,
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
