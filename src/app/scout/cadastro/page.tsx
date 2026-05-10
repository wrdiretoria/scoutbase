'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const organizacoes = [
  'Clube profissional',
  'Clube amador',
  'Agência de atletas',
  'Scout independente',
  'Escola / escolinha',
  'Federação / confederação',
  'Outro',
]

export default function ScoutCadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [nome, setNome]           = useState('')
  const [organizacao, setOrg]     = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!nome || !organizacao) { setError('Preencha todos os campos.'); return }
    setError(null)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome, organizacao, tipo: 'scout' } },
    })

    if (signUpErr) {
      setError(signUpErr.message === 'User already registered'
        ? 'Este email já está cadastrado.'
        : 'Não foi possível criar a conta. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/scout/busca')
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

        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
            ← Voltar
          </Link>

          {/* Steps */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: '3px', borderRadius: '2px',
                background: s <= step ? '#22c55e' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#22c55e', textTransform: 'uppercase' }}>
            {step === 1 ? 'Identificação · 1 de 2' : 'Acesso · 2 de 2'}
          </p>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            {step === 1 ? 'Acesso de scout' : 'Quase pronto'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {step === 1
              ? 'Diga quem você é. Isso ajuda a mostrar atletas relevantes.'
              : 'Crie seu acesso e comece a buscar talentos.'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Nome completo</label>
              <input
                type="text" required value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome" style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Organização</label>
              <select
                required value={organizacao} onChange={e => setOrg(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="" disabled style={{ background: '#06100a' }}>Selecione</option>
                {organizacoes.map(o => (
                  <option key={o} value={o} style={{ background: '#06100a' }}>{o}</option>
                ))}
              </select>
            </div>

            {error && (
              <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
                {error}
              </p>
            )}

            <button type="submit" style={{
              padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '16px', marginTop: '4px',
            }}>
              Continuar →
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Senha</label>
              <input
                type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '14px', borderRadius: '14px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '16px',
              opacity: loading ? 0.6 : 1, marginTop: '4px',
            }}>
              {loading ? 'Criando acesso…' : '🔍 Acessar busca de atletas'}
            </button>

            <button type="button" onClick={() => setStep(1)} style={{
              padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer',
            }}>
              ← Voltar
            </button>
          </form>
        )}

        <p style={{ marginTop: '28px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>
            Entrar →
          </Link>
        </p>
      </div>
    </main>
  )
}
