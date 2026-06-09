'use client'

import { useState } from 'react'
import AtletaCardLanding from './AtletaCardLanding'
import type { MaisCard } from '@/app/api/landing/mais/route'

type Props = {
  tipo:         'destaques' | 'visitados' | 'novos'
  initialItems: MaisCard[]
  initialOffset: number
  limit:         number
  hasMoreInit:   boolean
  showRank?:     boolean
}

export default function LoadMoreCards({
  tipo, initialItems, initialOffset, limit, hasMoreInit, showRank = false,
}: Props) {
  const [items, setItems]       = useState<MaisCard[]>(initialItems)
  const [offset, setOffset]     = useState(initialOffset)
  const [hasMore, setHasMore]   = useState(hasMoreInit)
  const [loading, setLoading]   = useState(false)

  async function carregarMais() {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const res  = await fetch(`/api/landing/mais?tipo=${tipo}&offset=${offset}&limit=${limit}`)
      const data = await res.json() as { items: MaisCard[]; hasMore: boolean }
      setItems(prev => [...prev, ...data.items])
      setOffset(prev => prev + limit)
      setHasMore(data.hasMore)
    } catch {
      // silencia erro de rede
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Cards */}
      {items.map((p, i) => (
        <AtletaCardLanding
          key={p.id}
          nome={p.nome}
          ovr={p.ovr}
          foto={p.foto}
          posicao={null}
          categoria={p.categoria}
          atributos={null}
          href={`/jogador/${p.id}`}
          athleteId={p.athlete_id}
          rank={showRank ? i + 1 : undefined}
          width="180px"
        />
      ))}

      {/* Botão Carregar Mais */}
      {hasMore && (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '8px' }}>
          <button
            onClick={carregarMais}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 32px', borderRadius: '100px',
              border: '1.5px solid rgba(0,230,118,0.40)',
              background: 'transparent',
              color: '#00e676', fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.08em', cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background .18s, border-color .18s',
            }}
          >
            {loading ? 'Carregando...' : 'Carregar Mais'}
          </button>
        </div>
      )}
    </>
  )
}
