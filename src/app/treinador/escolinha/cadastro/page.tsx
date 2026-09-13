'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const BG     = '#0a1410'
const CARD   = '#0f1d17'
const BORDER = '#1c2b24'
const GREEN  = '#00ff44'
const TEXT   = '#eef4f0'
const DIM    = '#8a9b91'

export default function EscolinhaCadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) { setError('Informe o nome da escolinha.'); return }
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: escolinha, error: escolinhaErr } = await supabase
        .from('escolinhas')
        .insert({ nome: nome.trim(), professor_id: user.id })
        .select()
        .single()

      if (escolinhaErr || !escolinha) {
        throw new Error('Não foi possível criar a escolinha. Tente novamente.')
      }

      const { error: treinadorErr } = await supabase
        .from('escolinha_treinadores')
        .insert({ escolinha_id: escolinha.id, profile_id: user.id, papel: 'dono', status: 'aceito' })

      if (treinadorErr) {
        throw new Error('Escolinha criada, mas houve um erro ao vincular seu acesso. Tente novamente.')
      }

      router.push(`/treinador/escolinha/${escolinha.id}`)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.'
      console.error('[escolinha-cadastro]', err)
      setError(msg)
      setLoading(false)
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
    color: TEXT, fontSize: '16px', outline: 'none', fontFamily: 'system-ui, sans-serif',
    transition: 'border-color .2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: DIM, marginBottom: '8px',
    letterSpacing: '0.04em', textTransform: 'uppercase',
  }

  return (
    <main style={{
      background: BG, minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '24px',
      paddingTop: 'max(24px, env(safe-area-inset-top))',
      paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '380px', margin: 'auto 0' }}>

        <div style={{ marginBottom: '32px' }}>
          <Link href="/treinador/dashboard" style={{
            display: 'inline-block', marginBottom: '24px', fontSize: '13px', color: DIM, textDecoration: 'none',
          }}>
            ← Voltar
          </Link>

          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: GREEN, textTransform: 'uppercase' }}>
            Nova escolinha
          </p>
          <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: 900, color: TEXT, letterSpacing: '-0.02em' }}>
            Crie sua escolinha
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: DIM }}>
            Você será o dono e poderá convidar outros treinadores depois.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Nome da escolinha</label>
            <input
              type="text" required autoFocus value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Ex: Escolinha Craque FC" style={fieldStyle}
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
              padding: '16px', borderRadius: '14px', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: GREEN, color: '#03150a', fontWeight: 800, fontSize: '16px',
              opacity: loading ? 0.6 : 1, marginTop: '4px',
              minHeight: '56px', boxShadow: `0 0 28px ${GREEN}33`,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {loading ? 'Criando…' : '🏟️ Criar escolinha'}
          </button>
        </form>

      </div>
    </main>
  )
}
