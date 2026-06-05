'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TreinadorRecuperarSenhaPage() {
  const [treinadorId, setTreinadorId] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [sent,        setSent]        = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const digitos    = treinadorId.trim().replace(/\D/g, '').padStart(5, '0')
    const athleteId  = `TR-${digitos}`
    const redirectTo = `${window.location.origin}/treinador/nova-senha`

    // Reset feito server-side para nunca expor o email ao browser
    const res = await fetch('/api/auth/reset-por-id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, redirectTo }),
    })

    if (!res.ok) {
      setError('Não foi possível enviar o email. Tente novamente.')
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '15px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }

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

        {sent ? (
          /* ── Sucesso: email enviado ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
            <h1 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
              Email enviado!
            </h1>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Enviamos um link de recuperação ao email cadastrado do treinador{' '}
              <strong style={{ color: '#fbbf24' }}>TR-{treinadorId.replace(/\D/g,'').padStart(5,'0')}</strong>.
            </p>
            <p style={{ margin: '0 0 32px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              Verifique sua caixa de entrada e clique no link para criar uma nova senha.
            </p>
            <Link
              href="/login"
              style={{
                display: 'block', padding: '14px', borderRadius: '14px',
                background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                color: '#fbbf24', fontWeight: 800, fontSize: '14px',
                textDecoration: 'none', textAlign: 'center',
              }}
            >
              ← Voltar para o login
            </Link>
          </div>
        ) : (
          /* ── Formulário ── */
          <>
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#fbbf24', textTransform: 'uppercase' }}>
                Treinador
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                Esqueceu a senha?
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Informe seu ID de treinador e enviaremos um link de recuperação ao email cadastrado.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  ID do Treinador
                </label>
                <input
                  type="text" required value={treinadorId}
                  onChange={e => setTreinadorId(e.target.value)}
                  placeholder="Ex: 16138"
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.06em' }}
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
                  background: '#fbbf24', color: 'black', fontWeight: 800,
                  fontSize: '15px', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Enviando…' : 'Enviar link de recuperação →'}
              </button>
            </form>
          </>
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