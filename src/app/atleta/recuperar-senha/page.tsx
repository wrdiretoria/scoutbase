'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Etapa = 'verificar' | 'nova-senha' | 'sucesso'

export default function RecuperarSenhaPage() {
  const router = useRouter()
  const [etapa, setEtapa] = useState<Etapa>('verificar')

  const [athleteId,     setAthleteId]     = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [novaSenha,     setNovaSenha]     = useState('')
  const [confirmar,     setConfirmar]     = useState('')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  async function handleVerificar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Verifica se ID + email batem (sem enviar nova senha ainda)
    const res = await fetch('/api/atleta/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, recoveryEmail, novaSenha: 'CHECK_ONLY_placeholder_123' }),
    })

    // Se retornar "senha deve ter 6 char" quer dizer que o perfil foi encontrado — placeholder inválido
    // Se retornar "ID ou email incorretos" — não encontrou
    const data = await res.json() as { ok?: boolean; error?: string }

    if (data.error === 'ID ou email de recuperação incorretos.') {
      setError('ID ou email de recuperação incorretos. Verifique e tente novamente.')
      setLoading(false)
      return
    }

    // Passou na verificação (erro esperado de senha curta = perfil existe)
    setLoading(false)
    setEtapa('nova-senha')
  }

  async function handleNovaSenha(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (novaSenha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmar) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/atleta/recuperar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteId, recoveryEmail, novaSenha }),
    })
    const data = await res.json() as { ok?: boolean; error?: string }

    if (!res.ok || data.error) {
      setError(data.error ?? 'Erro ao redefinir senha.')
      setLoading(false)
      return
    }

    setLoading(false)
    setEtapa('sucesso')
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

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </Link>
        </div>

        {/* ── ETAPA 1: verificar identidade ── */}
        {etapa === 'verificar' && (
          <>
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#22c55e', textTransform: 'uppercase' }}>
                Redefinir senha
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                Esqueceu a senha?
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                Informe o ID do atleta e o email de recuperação cadastrado para redefinir.
              </p>
            </div>

            <form onSubmit={handleVerificar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>ID do atleta</label>
                <input
                  type="text" required value={athleteId}
                  onChange={e => setAthleteId(e.target.value.toUpperCase())}
                  placeholder="00123"
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Email de recuperação</label>
                <input
                  type="email" required value={recoveryEmail}
                  onChange={e => setRecoveryEmail(e.target.value)}
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
                {loading ? 'Verificando…' : 'Verificar identidade →'}
              </button>
            </form>
          </>
        )}

        {/* ── ETAPA 2: nova senha ── */}
        {etapa === 'nova-senha' && (
          <>
            <div style={{ marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: '100px', marginBottom: '16px',
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              }}>
                <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 700 }}>✓ Identidade verificada</span>
              </div>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                Crie uma nova senha
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                Para o atleta <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{athleteId}</strong>
              </p>
            </div>

            <form onSubmit={handleNovaSenha} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nova senha</label>
                <input
                  type="password" required minLength={6}
                  value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input
                  type="password" required minLength={6}
                  value={confirmar} onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repita a senha"
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
                {loading ? 'Salvando…' : 'Salvar nova senha →'}
              </button>
            </form>
          </>
        )}

        {/* ── ETAPA 3: sucesso ── */}
        {etapa === 'sucesso' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
              Senha redefinida!
            </h1>
            <p style={{ margin: '0 0 32px', fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              A nova senha do atleta <strong style={{ color: '#22c55e' }}>{athleteId}</strong> foi salva com sucesso.
            </p>
            <button
              onClick={() => router.push('/login')}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: '#22c55e', color: 'black', fontWeight: 800,
                fontSize: '15px', cursor: 'pointer',
              }}
            >
              Ir para o login →
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