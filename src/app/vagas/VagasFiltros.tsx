'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const POSICOES = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Meia-Atacante', 'Ponta Direita', 'Ponta Esquerda',
  'Atacante', 'Centro-Avante',
]

const CATEGORIAS = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto']

type Props = { positionFiltro?: string; categoryFiltro?: string; cityFiltro?: string }

const selectStyle: React.CSSProperties = {
  padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '13px', outline: 'none',
  fontFamily: 'system-ui, sans-serif',
}

function buildUrl(p: { position?: string; category?: string; city?: string }) {
  const q = new URLSearchParams()
  if (p.position) q.set('position', p.position)
  if (p.category) q.set('category', p.category)
  if (p.city)     q.set('city', p.city)
  const s = q.toString()
  return `/vagas${s ? `?${s}` : ''}`
}

export default function VagasFiltros({ positionFiltro, categoryFiltro, cityFiltro }: Props) {
  const router = useRouter()
  const [city, setCity] = useState(cityFiltro ?? '')

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
      <select
        value={positionFiltro ?? ''}
        onChange={e => router.push(buildUrl({ position: e.target.value, category: categoryFiltro, city: cityFiltro }))}
        style={{ ...selectStyle, flex: '1 1 140px' }}
      >
        <option value="">Todas as posições</option>
        {POSICOES.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      <select
        value={categoryFiltro ?? ''}
        onChange={e => router.push(buildUrl({ position: positionFiltro, category: e.target.value, city: cityFiltro }))}
        style={{ ...selectStyle, flex: '1 1 120px' }}
      >
        <option value="">Todas as categorias</option>
        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <form
        onSubmit={e => { e.preventDefault(); router.push(buildUrl({ position: positionFiltro, category: categoryFiltro, city })) }}
        style={{ display: 'flex', gap: '6px', flex: '1 1 160px' }}
      >
        <input
          value={city}
          onChange={e => setCity(e.target.value)}
          placeholder="Cidade…"
          style={{ ...selectStyle, flex: 1 }}
        />
        <button type="submit" style={{
          padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(34,197,94,0.2)',
          background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 700, fontSize: '13px',
          cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
        }}>
          🔍
        </button>
      </form>
    </div>
  )
}
