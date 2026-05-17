'use client'

/**
 * RankingFiltros — filtros interativos do ranking (posição + cidade).
 * As categorias ficam no Server Component como pills (sem JS).
 */

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

const POSICOES = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Meia-Atacante', 'Ponta Direita', 'Ponta Esquerda',
  'Atacante', 'Centro-Avante',
]

type Props = {
  categoriaFiltro?: string
  posicaoFiltro?:   string
  cidadeFiltro?:    string
}

function buildUrl(p: { categoria?: string; posicao?: string; cidade?: string }) {
  const q = new URLSearchParams()
  if (p.categoria) q.set('categoria', p.categoria)
  if (p.posicao)   q.set('posicao',   p.posicao)
  if (p.cidade)    q.set('cidade',    p.cidade)
  const s = q.toString()
  return `/ranking${s ? `?${s}` : ''}`
}

export default function RankingFiltros({ categoriaFiltro, posicaoFiltro, cidadeFiltro }: Props) {
  const router  = useRouter()
  const [cidade, setCidade] = useState(cidadeFiltro ?? '')

  useEffect(() => { setCidade(cidadeFiltro ?? '') }, [cidadeFiltro])

  function onPosicao(pos: string) {
    router.push(buildUrl({ categoria: categoriaFiltro, posicao: pos || undefined, cidade: cidadeFiltro }))
  }

  function onCidadeSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(buildUrl({ categoria: categoriaFiltro, posicao: posicaoFiltro, cidade: cidade.trim() || undefined }))
  }

  const temFiltro = posicaoFiltro || cidadeFiltro

  const selectBase: React.CSSProperties = {
    padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
  }

  return (
    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Posição */}
        <select
          value={posicaoFiltro ?? ''}
          onChange={e => onPosicao(e.target.value)}
          style={{ ...selectBase, flex: '1', minWidth: '140px' }}
        >
          <option value="">Todas as posições</option>
          {POSICOES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Cidade */}
        <form onSubmit={onCidadeSubmit} style={{ display: 'flex', gap: '6px', flex: '1', minWidth: '160px' }}>
          <input
            value={cidade}
            onChange={e => setCidade(e.target.value)}
            placeholder="Cidade..."
            style={{
              ...selectBase,
              flex: 1, cursor: 'text',
              color: cidade ? 'white' : 'rgba(255,255,255,0.35)',
            }}
          />
          <button type="submit" style={{
            padding: '9px 14px', borderRadius: '10px', border: 'none',
            background: '#22c55e', color: 'black', fontWeight: 800,
            fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
            flexShrink: 0,
          }}>
            →
          </button>
        </form>

        {/* Limpar filtros extras */}
        {temFiltro && (
          <a
            href={buildUrl({ categoria: categoriaFiltro })}
            style={{
              padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', textDecoration: 'none', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            ✕ Limpar
          </a>
        )}
      </div>

      {/* Tags dos filtros ativos */}
      {temFiltro && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {posicaoFiltro && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#22c55e',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              {posicaoFiltro}
            </span>
          )}
          {cidadeFiltro && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#60a5fa',
              background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              📍 {cidadeFiltro}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
