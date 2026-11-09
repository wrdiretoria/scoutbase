'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const organizacoes = [
  'Clube profissional',
  'Clube amador',
  'Agência de atletas',
  'Escola / escolinha',
  'Federação / confederação',
  'Outro',
]

export default function ScoutCadastroPage() {
  const router = useRouter()
  const [nome, setNome]           = useState('')
  const [cidade, setCidade] = useState('')
  const [confirmacao, setConfirmacao] = useState(false)
  const [organizacao, setOrg]     = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!nome.trim() || !cidade.trim()) {
      setError('Informe seu nome e sua cidade.')
      return
    }
    setLoading(true)

    const supabase = createClient()
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome: nome.trim(), cidade: cidade.trim(), organizacao: organizacao || 'Scout independente', tipo: 'scout' } },
    })

    if (signUpErr) {
      setError(signUpErr.message === 'User already registered'
        ? 'Este email já está cadastrado.'
        : 'Não foi possível criar a conta. Tente novamente.')
      setLoading(false)
      return
    }

    if (!data.session) {
      setConfirmacao(true)
      setLoading(false)
      return
    }

    router.replace('/scout/busca')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'inherit',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'rgba(255,255,255,0.5)', marginBottom: '8px',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  }

  return (
    <main style={{
      background: 'var(--mc-canvas)', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'inherit',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>

        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'block', marginBottom: '24px' }}>
            ← Voltar
          </Link>

          <h1 style={{ margin: '0 0 6px', fontSize: 26, color: 'white' }}>Criar conta de scout</h1>
          <p style={{ margin: 0, color: 'var(--mc-muted)' }}>Encontre atletas, veja seus lances e salve os perfis que quer acompanhar.</p>
        </div>

        {confirmacao ? (
          <p role="status" style={{ color: 'white' }}>Confira seu e-mail para confirmar a conta. Depois, <Link href="/scout/entrar" style={{ color: '#b3f737' }}>entre como scout</Link>.</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="scout-nome" style={labelStyle}>Nome completo</label>
              <input
                id="scout-nome" autoComplete="name" type="text" required value={nome} onChange={e => setNome(e.target.value)}
                placeholder="Seu nome" style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="scout-cidade" style={labelStyle}>Cidade</label>
              <input id="scout-cidade" type="text" required maxLength={100} autoComplete="address-level2" value={cidade} onChange={e => setCidade(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label htmlFor="scout-organizacao" style={labelStyle}>Organização (opcional)</label>
              <select
                id="scout-organizacao" value={organizacao} onChange={e => setOrg(e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="" style={{ background: 'var(--mc-canvas)' }}>Scout independente</option>
                {organizacoes.map(o => (
                  <option key={o} value={o} style={{ background: 'var(--mc-canvas)' }}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="scout-email" style={labelStyle}>Email</label>
              <input
                id="scout-email" autoComplete="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" style={inputStyle}
              />
            </div>

            <div>
              <label htmlFor="scout-senha" style={labelStyle}>Senha</label>
              <input
                id="scout-senha" autoComplete="new-password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
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
              background: '#b3f737', color: 'black', fontWeight: 800, fontSize: '16px',
              opacity: loading ? 0.6 : 1, marginTop: '4px',
            }}>
              {loading ? 'Criando acesso…' : 'Criar conta'}
            </button>

          </form>
        )}

        <p style={{ marginTop: '28px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          Já tem conta?{' '}
          <Link href="/scout/entrar" style={{ color: '#b3f737', textDecoration: 'none', fontWeight: 700 }}>
            Entrar →
          </Link>
        </p>
      </div>
    </main>
  )
}
