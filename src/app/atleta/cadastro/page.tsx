'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const posicoes = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Meia-Atacante',
  'Ponta Direita', 'Ponta Esquerda', 'Atacante', 'Centro-Avante',
]

export default function AtletaCadastroPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [nome, setNome] = useState('')
  const [posicao, setPosicao] = useState('')
  const [cidade, setCidade] = useState('')
  const [dataNasc, setDataNasc] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleNext(e: React.FormEvent) {
    e.preventDefault()
    if (!nome || !posicao || !cidade || !dataNasc) {
      setError('Preencha todos os campos.')
      return
    }
    setError(null)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consent) { setError('Confirme o consentimento para continuar.'); return }
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nome, posicao, cidade, tipo: 'atleta' },
      },
    })

    if (signUpErr || !data.user) {
      setError(signUpErr?.message === 'User already registered'
        ? 'Este email já está cadastrado.'
        : 'Não foi possível criar a conta. Tente novamente.')
      setLoading(false)
      return
    }

    // Salva data de nascimento no perfil
    await fetch('/api/atleta/salvar-perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: data.user.id,
        dataNascimento: dataNasc,
        nome,
        email,
      }),
    })

    const params = new URLSearchParams({ nome, posicao, cidade, dataNasc, uid: data.user.id })
    router.push(`/atleta/bem-vindo?${params.toString()}`)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '15px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/cadastro" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
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
            {step === 1 ? 'Identidade · 1 de 2' : 'Acesso · 2 de 2'}
          </p>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            {step === 1 ? 'Monte seu perfil' : 'Quase lá'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {step === 1
              ? 'Essas informações constroem sua identidade no ranking.'
              : 'Crie seu acesso e entre no jogo.'}
          </p>
        </div>

        {/* STEP 1 — Identidade */}
        {step === 1 && (
          <form onSubmit={handleNext} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={labelStyle}>Nome completo</label>
              <input
                type="text" required value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome de atleta" style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Posição</label>
              <select
                required value={posicao} onChange={e => setPosicao(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="" disabled style={{ background: '#06100a' }}>Selecione sua posição</option>
                {posicoes.map(p => (
                  <option key={p} value={p} style={{ background: '#06100a' }}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Cidade</label>
              <input
                type="text" required value={cidade} onChange={e => setCidade(e.target.value)}
                placeholder="Sua cidade" style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Data de nascimento</label>
              <input
                type="date" required value={dataNasc} onChange={e => setDataNasc(e.target.value)}
                style={inputStyle}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                Usada para colocar você na categoria certa (Sub-13, Sub-15…)
              </p>
            </div>

            {error && <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>{error}</p>}

            <button type="submit" style={{
              padding: '14px', borderRadius: '14px', border: 'none', cursor: 'pointer',
              background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '16px', marginTop: '4px',
            }}>
              Continuar →
            </button>
          </form>
        )}

        {/* STEP 2 — Acesso */}
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

            {/* Consentimento */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <div
                onClick={() => setConsent(!consent)}
                style={{
                  width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                  background: consent ? '#22c55e' : 'rgba(255,255,255,0.06)',
                  border: `1.5px solid ${consent ? '#22c55e' : 'rgba(255,255,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', cursor: 'pointer',
                }}
              >
                {consent && <span style={{ fontSize: '12px', color: 'black', fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Confirmo que tenho autorização para criar este perfil e concordo com os{' '}
                <Link href="#" style={{ color: '#22c55e', textDecoration: 'none' }}>termos de uso</Link>.
              </span>
            </label>

            {error && <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>{error}</p>}

            <button
              type="submit" disabled={loading}
              style={{
                padding: '14px', borderRadius: '14px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '16px',
                opacity: loading ? 0.6 : 1, marginTop: '4px',
              }}
            >
              {loading ? 'Criando perfil…' : '🔥 Entrar no jogo'}
            </button>

            <button type="button" onClick={() => setStep(1)} style={{
              padding: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer',
            }}>
              ← Voltar
            </button>
          </form>
        )}
        {/* Link para login */}
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
