'use client'

import { useState } from 'react'
import Link from 'next/link'

type Atleta = { athlete_id: string; nome: string }
type Modo = 'email' | 'nome'

export default function RecuperarIdPage() {
  const [modo, setModo]       = useState<Modo>('email')
  const [email, setEmail]     = useState('')
  const [nome, setNome]       = useState('')
  const [dataNasc, setDataNasc] = useState('')
  const [loading, setLoading] = useState(false)
  const [atletas, setAtletas] = useState<Atleta[]>([])
  const [error, setError]     = useState<string | null>(null)
  const [done, setDone]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const body = modo === 'email'
      ? { email }
      : { nome, dataNascimento: dataNasc }

    const res  = await fetch('/api/atleta/recuperar-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json() as { atletas?: Atleta[]; error?: string }

    if (!res.ok || data.error) {
      setError(data.error ?? 'Nenhum atleta encontrado.')
    } else {
      setAtletas(data.atletas ?? [])
      setDone(true)
    }

    setLoading(false)
  }

  function handleReset() {
    setDone(false); setAtletas([]); setError(null)
    setEmail(''); setNome(''); setDataNasc('')
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
      background: '#06100a', minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </Link>
        </div>

        {!done ? (
          <>
            {/* Título */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#22c55e', textTransform: 'uppercase' }}>
                Atleta
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                Esqueceu o ID?
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Escolha como prefere buscar.
              </p>
            </div>

            {/* Abas */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px',
            }}>
              {(['email', 'nome'] as Modo[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setModo(m); setError(null) }}
                  style={{
                    padding: '11px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '13px',
                    background: modo === m ? '#22c55e' : 'rgba(255,255,255,0.06)',
                    color: modo === m ? 'black' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.18s',
                  }}
                >
                  {m === 'email' ? '📧 Email' : '👤 Nome'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {modo === 'email' && (
                <div>
                  <label style={labelStyle}>Email de recuperação</label>
                  <input
                    type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email do responsável"
                    style={inputStyle}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
                    O email cadastrado no momento do registro do atleta.
                  </p>
                </div>
              )}

              {modo === 'nome' && (
                <>
                  <div>
                    <label style={labelStyle}>Nome do atleta</label>
                    <input
                      type="text" required value={nome} minLength={3}
                      onChange={e => setNome(e.target.value)}
                      placeholder="Nome completo"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Data de nascimento</label>
                    <input
                      type="date" required value={dataNasc}
                      onChange={e => setDataNasc(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <p style={{ margin: '-8px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
                    Use apenas se não tiver acesso ao email de recuperação.
                  </p>
                </>
              )}

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
                  fontSize: '15px', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Buscando…' : 'Buscar meu ID →'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Resultado */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#22c55e', textTransform: 'uppercase' }}>
                ✓ Encontrado
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                {atletas.length === 1 ? '1 atleta encontrado' : `${atletas.length} atletas encontrados`}
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                Use o ID + senha para entrar
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {atletas.map(a => (
                <div key={a.athlete_id} style={{
                  padding: '18px 20px', borderRadius: '16px',
                  background: 'rgba(0,255,136,0.05)',
                  border: '1.5px solid rgba(0,255,136,0.25)',
                }}>
                  <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{a.nome}</p>
                  <p style={{ margin: 0, fontSize: '32px', fontWeight: 900, color: '#00FF88', letterSpacing: '0.06em', lineHeight: 1 }}>
                    {a.athlete_id}
                  </p>
                </div>
              ))}
            </div>

            <Link href="/login" style={{
              display: 'block', textAlign: 'center', padding: '14px', borderRadius: '14px',
              background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '15px',
              textDecoration: 'none',
            }}>
              Ir para o login →
            </Link>

            <button
              type="button" onClick={handleReset}
              style={{
                display: 'block', width: '100%', marginTop: '12px', padding: '12px',
                borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'rgba(255,255,255,0.35)',
                fontSize: '13px', cursor: 'pointer',
              }}
            >
              Buscar novamente
            </button>
          </>
        )}

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>← Voltar para o login</Link>
        </p>
      </div>
    </main>
  )
}
