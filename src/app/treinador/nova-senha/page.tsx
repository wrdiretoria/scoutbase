'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function NovaSenhaContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const [status,    setStatus]    = useState<'loading' | 'ready' | 'error' | 'done'>('loading')
  const [senha,     setSenha]     = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saveErr,   setSaveErr]   = useState<string | null>(null)

  // Troca o code do link pelo session
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) { setStatus('error'); return }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        setStatus(error ? 'error' : 'ready')
      })
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaveErr(null)

    if (senha.length < 6) { setSaveErr('A senha deve ter pelo menos 6 caracteres.'); return }
    if (senha !== confirmar) { setSaveErr('As senhas não coincidem.'); return }

    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: senha })

    if (error) {
      setSaveErr('Não foi possível salvar. Tente solicitar um novo link.')
      setSaving(false)
    } else {
      setStatus('done')
      setTimeout(() => router.push('/treinador/dashboard'), 2000)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: '12px', boxSizing: 'border-box',
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
      background: '#080400', minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <Link href="/" style={{ fontSize: '18px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
            ⚽ MEU <span style={{ color: '#fbbf24' }}>CRAQUE</span>
          </Link>
        </div>

        {/* Carregando */}
        {status === 'loading' && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Verificando link…
          </div>
        )}

        {/* Link inválido ou expirado */}
        {status === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
            <h1 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 900, color: 'white' }}>Link inválido</h1>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
              Este link expirou ou é inválido. Solicite um novo.
            </p>
            <Link href="/treinador/recuperar-senha" style={{
              display: 'block', padding: '14px', borderRadius: '14px',
              background: '#fbbf24', color: 'black', fontWeight: 800,
              fontSize: '14px', textDecoration: 'none', textAlign: 'center',
            }}>
              Solicitar novo link
            </Link>
          </div>
        )}

        {/* Formulário de nova senha */}
        {status === 'ready' && (
          <>
            <div style={{ marginBottom: '28px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#fbbf24', textTransform: 'uppercase' }}>
                Treinador
              </p>
              <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>
                Nova senha
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                Escolha uma senha forte para sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nova senha</label>
                <input type="password" required minLength={6} value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Mínimo 6 caracteres" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input type="password" required minLength={6} value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  placeholder="Repita a senha" style={inputStyle} />
              </div>

              {saveErr && (
                <p style={{ margin: 0, padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
                  {saveErr}
                </p>
              )}

              <button type="submit" disabled={saving}
                style={{
                  padding: '14px', borderRadius: '14px', border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  background: '#fbbf24', color: 'black', fontWeight: 800,
                  fontSize: '15px', opacity: saving ? 0.6 : 1,
                }}>
                {saving ? 'Salvando…' : 'Salvar nova senha →'}
              </button>
            </form>
          </>
        )}

        {/* Sucesso */}
        {status === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: 'white' }}>Senha salva!</h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
              Redirecionando para o dashboard…
            </p>
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

export default function TreinadorNovaSenhaPage() {
  return (
    <Suspense fallback={
      <main style={{ background:'#06100a', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(34,197,94,0.2)', borderTopColor:'#22c55e', animation:'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    }>
      <NovaSenhaContent />
    </Suspense>
  )
}