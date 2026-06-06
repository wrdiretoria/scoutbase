'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TreinadorRecuperarIdPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<{ treinadorId: string; nome: string } | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res  = await fetch('/api/treinador/recuperar-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json() as { ok?: boolean; treinadorId?: string; nome?: string; error?: string }

    if (!res.ok || data.error) {
      setError(data.error ?? 'Nenhum treinador encontrado.')
    } else if (data.treinadorId) {
      setResult({ treinadorId: data.treinadorId, nome: data.nome ?? '' })
    } else {
      // Resposta neutra — não revela se email existe
      setError('Nenhum treinador encontrado com este email.')
    }

    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }

  const idNumerico = result?.treinadorId?.replace('TR-', '') ?? ''

  return (
    <main style={{
      background: '#080400', minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
          </Link>
        </div>

        {!result ? (
          <>
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#fbbf24', textTransform: 'uppercase' }}>
                Treinador
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                Esqueceu o ID?
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Informe o email cadastrado no seu perfil de treinador e encontraremos seu ID.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)', marginBottom: '8px',
                  letterSpacing: '0.04em', textTransform: 'uppercase',
                }}>
                  Email do treinador
                </label>
                <input
                  type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  style={inputStyle}
                />
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
                  O email que você usou ao criar sua conta de treinador.
                </p>
              </div>

              {error && (
                <div style={{
                  padding: '12px 14px', borderRadius: '12px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <p style={{ margin: 0, fontSize: '13px', color: '#f87171', fontWeight: 600 }}>
                    ⚠️ {error}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(248,113,113,0.7)' }}>
                    Se você se cadastrou recentemente, aguarde alguns minutos e tente novamente.
                  </p>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                style={{
                  padding: '14px', borderRadius: '14px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: '#fbbf24', color: 'black', fontWeight: 800,
                  fontSize: '15px', opacity: loading ? 0.6 : 1,
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {loading ? 'Buscando…' : 'Encontrar meu ID →'}
              </button>
            </form>
          </>
        ) : (
          /* ── Resultado ── */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏅</div>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#fbbf24', textTransform: 'uppercase' }}>
                ✓ Encontrado
              </p>
              <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                Seu ID de treinador
              </h1>
              {result.nome && (
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                  {result.nome}
                </p>
              )}
            </div>

            {/* Card com o ID */}
            <div style={{
              padding: '24px 20px', borderRadius: '18px', marginBottom: '20px',
              background: 'rgba(251,191,36,0.06)',
              border: '1.5px solid rgba(251,191,36,0.3)',
              textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ID do Treinador
              </p>
              <p style={{ margin: 0, fontSize: '42px', fontWeight: 900, color: '#fbbf24', letterSpacing: '0.08em', lineHeight: 1.1 }}>
                {idNumerico}
              </p>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
                Use este número no login junto com sua senha
              </p>
            </div>

            <Link
              href="/login"
              style={{
                display: 'block', padding: '14px', borderRadius: '14px',
                background: '#fbbf24', color: 'black', fontWeight: 800,
                fontSize: '15px', textDecoration: 'none', textAlign: 'center',
                marginBottom: '10px',
              }}
            >
              Ir para o login →
            </Link>

            <button
              type="button"
              onClick={() => { setResult(null); setEmail(''); setError(null) }}
              style={{
                display: 'block', width: '100%', padding: '12px', borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              Buscar novamente
            </button>
          </div>
        )}

        <p style={{ marginTop: '28px', textAlign: 'center', fontSize: '13px' }}>
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>
            ← Voltar para o login
          </Link>
        </p>

      </div>
    </main>
  )
}
