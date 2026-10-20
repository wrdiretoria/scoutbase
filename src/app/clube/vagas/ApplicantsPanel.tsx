'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Atleta = { id: string; nome: string | null; avatarUrl: string | null; athleteId: string | null }
type Candidatura = { id: string; athlete_id: string; status: string; created_at: string; athlete: Atleta | null }
type CandidaturaComOportunidade = Candidatura & { opportunity_id: string }

function iniciais(nome: string | null) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Nova', viewed: 'Vista', accepted: 'Aceita', rejected: 'Recusada',
}
const STATUS_COLOR: Record<string, string> = {
  submitted: '#60a5fa', viewed: '#fbbf24', accepted: '#22c55e', rejected: '#f87171',
}

function AcaoCandidatura({ candidatura, onChange }: {
  candidatura: CandidaturaComOportunidade
  onChange: (id: string, status: string) => void
}) {
  const [sending, setSending] = useState(false)

  async function mudar(status: string) {
    if (sending || candidatura.status === status) return
    setSending(true)
    try {
      const res = await fetch(`/api/opportunities/${candidatura.opportunity_id}/applications/${candidatura.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) onChange(candidatura.id, status)
    } catch { /* silencioso */ } finally { setSending(false) }
  }

  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {['viewed', 'accepted', 'rejected'].map(s => (
        <button
          key={s}
          onClick={() => mudar(s)}
          disabled={sending || candidatura.status === s}
          style={{
            padding: '5px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
            border: `1px solid ${candidatura.status === s ? STATUS_COLOR[s] : 'rgba(255,255,255,0.1)'}40`,
            background: candidatura.status === s ? `${STATUS_COLOR[s]}22` : 'rgba(255,255,255,0.03)',
            color: candidatura.status === s ? STATUS_COLOR[s] : 'rgba(255,255,255,0.45)',
            cursor: sending || candidatura.status === s ? 'default' : 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {STATUS_LABEL[s]}
        </button>
      ))}
    </div>
  )
}

export default function ApplicantsPanel({ opportunityId }: { opportunityId: string }) {
  const [candidaturas, setCandidaturas] = useState<CandidaturaComOportunidade[] | null>(null)

  useEffect(() => {
    let ativo = true
    fetch(`/api/opportunities/${opportunityId}/applications`)
      .then(res => res.json())
      .then((data: { applications: Candidatura[] }) => {
        if (ativo) setCandidaturas((data.applications ?? []).map(c => ({ ...c, opportunity_id: opportunityId })))
      })
      .catch(() => { if (ativo) setCandidaturas([]) })
    return () => { ativo = false }
  }, [opportunityId])

  function handleChange(id: string, status: string) {
    setCandidaturas(prev => prev?.map(c => c.id === id ? { ...c, status } : c) ?? prev)
  }

  if (candidaturas === null) {
    return <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Carregando candidatos…</p>
  }
  if (candidaturas.length === 0) {
    return <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Ainda não há candidatos.</p>
  }

  return (
    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {candidaturas.map(c => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {c.athlete?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.athlete.avatarUrl} alt={c.athlete.nome ?? ''} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#15803d,#4ade80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 900, color: 'white',
            }}>
              {iniciais(c.athlete?.nome ?? null)}
            </div>
          )}
          <Link href={`/jogador/${c.athlete_id}`} style={{ flex: 1, minWidth: 0, textDecoration: 'none' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.athlete?.nome ?? 'Atleta'}
            </p>
          </Link>
          <AcaoCandidatura candidatura={c} onChange={handleChange} />
        </div>
      ))}
    </div>
  )
}
