'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'
import NovaVagaForm from './NovaVagaForm'
import ApplicantsPanel from './ApplicantsPanel'

type Vaga = {
  id: string; title: string; position: string | null; category: string | null
  city: string | null; description: string | null; status: string; created_at: string
}

function ehTreinador(meta: Record<string, unknown>) {
  return meta.tipo === 'treinador' || meta.tipo === 'escola'
    || (!meta.posicao && !meta.athlete_id && (meta.clube_atual || meta.especialidade || meta.anos_exp || meta.certificacoes || meta.clubes_trabalhados))
}

export default function ClubeVagasPage() {
  const router = useRouter()
  const [userId, setUserId]     = useState<string | null>(null)
  const [vagas, setVagas]       = useState<Vaga[] | null>(null)
  const [loading, setLoading]   = useState(true)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [fechando, setFechando] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (!ehTreinador(user.user_metadata ?? {})) { router.push('/atleta/perfil'); return }
      setUserId(user.id)

      const res = await fetch(`/api/opportunities?clubId=${user.id}&status=all`)
      const data = await res.json() as { opportunities: Vaga[] }
      setVagas(data.opportunities ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  function handleCriada(v: Vaga) {
    setVagas(prev => [v, ...(prev ?? [])])
  }

  async function alternarStatus(vaga: Vaga) {
    if (fechando) return
    setFechando(vaga.id)
    const novoStatus = vaga.status === 'open' ? 'closed' : 'open'
    try {
      const res = await fetch(`/api/opportunities/${vaga.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (res.ok) {
        setVagas(prev => prev?.map(v => v.id === vaga.id ? { ...v, status: novoStatus } : v) ?? prev)
      }
    } catch { /* silencioso */ } finally { setFechando(null) }
  }

  if (loading) {
    return (
      <main style={{ background: '#06100a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontFamily: 'system-ui, sans-serif' }}>Carregando…</p>
      </main>
    )
  }

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white', padding: '24px 20px 100px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>💼 Minhas vagas</h1>
          {userId && (
            <Link href={`/clube/${userId}`} style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', textDecoration: 'none' }}>
              Ver página pública →
            </Link>
          )}
        </div>

        <NovaVagaForm onCriada={handleCriada} />

        {vagas !== null && vagas.length === 0 && (
          <div style={{
            padding: '32px', borderRadius: '16px', textAlign: 'center',
            background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
              Você ainda não publicou nenhuma vaga.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {vagas?.map(v => (
            <div key={v.id} style={{
              background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '16px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 800, color: 'white' }}>{v.title}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                    {[v.position, v.category, v.city].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}
                  </p>
                </div>
                <span style={{
                  flexShrink: 0, padding: '3px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 800,
                  color: v.status === 'open' ? '#22c55e' : 'rgba(255,255,255,0.4)',
                  background: v.status === 'open' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${v.status === 'open' ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                }}>
                  {v.status === 'open' ? 'Aberta' : 'Fechada'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={() => setExpandido(prev => prev === v.id ? null : v.id)}
                  style={{
                    padding: '7px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)',
                    fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {expandido === v.id ? 'Ocultar candidatos' : 'Ver candidatos'}
                </button>
                <button
                  onClick={() => alternarStatus(v)}
                  disabled={fechando === v.id}
                  style={{
                    padding: '7px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: 'rgba(255,255,255,0.4)',
                    fontWeight: 700, fontSize: '12px', cursor: fechando === v.id ? 'default' : 'pointer',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {v.status === 'open' ? 'Fechar vaga' : 'Reabrir vaga'}
                </button>
              </div>

              {expandido === v.id && <ApplicantsPanel opportunityId={v.id} />}
            </div>
          ))}
        </div>

      </div>

      <TreinadorBottomNav />
    </main>
  )
}
