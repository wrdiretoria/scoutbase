'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Atleta = { id: string; nome: string | null; avatarUrl: string | null; athleteId: string | null; position: string | null; category: string | null }
type Candidatura = { id: string; athlete_id: string; status: string; created_at: string; athlete: Atleta | null }
type CandidaturaComOportunidade = Candidatura & { opportunity_id: string }

function iniciais(nome: string | null) {
  if (!nome) return '?'
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Nova', viewed: 'Vista', accepted: 'Selecionada', rejected: 'Recusada',
}
const STATUS_COLOR: Record<string, string> = {
  submitted: '#60a5fa', viewed: '#fbbf24', accepted: '#22c55e', rejected: '#f87171',
}

function AcaoCandidatura({ candidatura, onChange }: {
  candidatura: CandidaturaComOportunidade
  onChange: (id: string, status: string) => void
}) {
  const [sending, setSending] = useState(false)

  const [error, setError] = useState(false)

  async function mudar(status: string) {
    if (sending || candidatura.status === status) return
    setSending(true)
    setError(false)
    try {
      const res = await fetch(`/api/opportunities/${candidatura.opportunity_id}/applications/${candidatura.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar candidatura')
      onChange(candidatura.id, status)
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {(['viewed', 'accepted', 'rejected'] as const).map(s => (
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
          {candidatura.status === s ? STATUS_LABEL[s] : { viewed: 'Marcar como vista', accepted: 'Selecionar', rejected: 'Recusar' }[s]}
        </button>
      ))}
      {error && <small role="alert" style={{ color: '#f87171' }}>Não foi possível atualizar a candidatura. Tente novamente.</small>}
    </div>
  )
}

export default function ApplicantsPanel({ opportunityId }: { opportunityId: string }) {
  const [candidaturas, setCandidaturas] = useState<CandidaturaComOportunidade[] | null>(null)

  const [position, setPosition] = useState('')
  const [category, setCategory] = useState('')
  const [selectedOnly, setSelectedOnly] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let ativo = true
    setLoadError(false)
    fetch(`/api/opportunities/${opportunityId}/applications`)
      .then(res => {
        if (!res.ok) throw new Error('Falha ao carregar candidaturas')
        return res.json()
      })
      .then((data: { applications: Candidatura[] }) => {
        if (ativo) setCandidaturas((data.applications ?? []).map(c => ({ ...c, opportunity_id: opportunityId })))
      })
      .catch(() => { if (ativo) setLoadError(true) })
    return () => { ativo = false }
  }, [opportunityId, attempt])

  function handleChange(id: string, status: string) {
    setCandidaturas(prev => prev?.map(c => c.id === id ? { ...c, status } : c) ?? prev)
  }

  if (loadError) {
    return <p role="alert">Não foi possível carregar as inscrições. <button type="button" onClick={() => setAttempt(n => n + 1)}>Tentar novamente</button></p>
  }
  if (candidaturas === null) {
    return <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Carregando candidatos…</p>
  }
  if (candidaturas.length === 0) {
    return <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Ainda não há candidatos.</p>
  }

  const positions = [...new Set(candidaturas.map(c => c.athlete?.position).filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const categories = [...new Set(candidaturas.map(c => c.athlete?.category).filter((value): value is string => !!value))].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
  const selectedCount = candidaturas.filter(c => c.status === 'accepted').length
  const filtered = candidaturas.filter(c =>
    (!position || c.athlete?.position === position)
    && (!category || c.athlete?.category === category)
    && (!selectedOnly || c.status === 'accepted'),
  )
  const filterStyle = { background: '#14211a', color: 'white', minHeight: 40, border: '1px solid #405247', borderRadius: 8, padding: '6px 8px', maxWidth: '100%' }

  return (
    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div role="group" aria-label="Filtrar inscrições" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <select aria-label="Posição" value={position} onChange={event => setPosition(event.target.value)} style={filterStyle}>
          <option value="">Todas as posições</option>
          {positions.map(value => <option key={value}>{value}</option>)}
        </select>
        <select aria-label="Categoria" value={category} onChange={event => setCategory(event.target.value)} style={filterStyle}>
          <option value="">Todas as categorias</option>
          {categories.map(value => <option key={value}>{value}</option>)}
        </select>
        <label style={{ fontSize: 13 }}>
          <input type="checkbox" checked={selectedOnly} onChange={event => setSelectedOnly(event.target.checked)} /> Só selecionados ({selectedCount})
        </label>
      </div>
      <p role="status" style={{ fontSize: 12, margin: 0, color: '#c4d0c9' }}>{filtered.length} de {candidaturas.length} inscrições</p>
      {filtered.length === 0 && <p style={{ margin: 0, fontSize: 13 }}>Nenhuma inscrição com esses filtros.</p>}
      {filtered.map(c => (
        <div key={c.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
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
          <Link href={`/jogador/${c.athlete_id}`} style={{ flex: '1 1 145px', minWidth: 0, textDecoration: 'none' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {c.athlete?.nome ?? 'Atleta'}
            </p>
            <small style={{ color: '#c4d0c9' }}>{[c.athlete?.position, c.athlete?.category, STATUS_LABEL[c.status]].filter(Boolean).join(' · ')}</small>
          </Link>
          <AcaoCandidatura candidatura={c} onChange={handleChange} />
        </div>
      ))}
    </div>
  )
}
