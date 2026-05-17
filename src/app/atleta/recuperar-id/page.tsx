'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RecuperarIdPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [atletas, setAtletas] = useState<{ athlete_id: string; nome: string }[]>([])
  const [error,   setError]   = useState<string | null>(null)
  const [done,    setDone]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/atleta/recuperar-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json() as { atletas?: { athlete_id: string; nome: string }[]; error?: string }

    if (!res.ok || data.error) {
      setError(data.error ?? 'Nenhum atleta encontrado com este email.')
    } else {
      setAtletas(data.atletas ?? [])
      setDone(true)
    }

    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '15px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }

  return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </Link>
        </div>

        {!done ? (
          <>
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#22c55e', textTransform: 'uppercase' }}>
                Recuperar ID
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                Esqueceu o ID?
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Digite o email de recuperação cadastrado. Vamos mostrar os IDs de todos os atletas vinculados a ele.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Email de recuperação
                </label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email do responsável"
                  style={inputStyle}
                />
              </div>

              {error && (
                <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
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
                {loading ? 'Buscando…' : 'Buscar meus atletas →'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#22c55e', textTransform: 'uppercase' }}>
                ✓ Encontrado
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                {atletas.length === 1 ? '1 atleta encontrado' : `${atletas.length} atletas encontrados`}
              </h1>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
                Use o ID e a senha para entrar
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
          </>
        )}

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>← Voltar para o login</Link>
        </p>
      </div>
    </main>
  )
}