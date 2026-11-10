'use client'

/**
 * Botão de favorito — funciona sem login.
 * IDs salvos em localStorage sob a chave "mc_favoritos".
 */

import { useEffect, useState } from 'react'

const LS_KEY = 'mc_favoritos'

function getFavoritos(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]') as string[]
  } catch { return [] }
}

function setFavoritos(ids: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(ids))
}

export default function FavoritoButton({ atletaId }: { atletaId: string }) {
  const [favoritado, setFavoritado] = useState(false)
  const [mounted,    setMounted]    = useState(false)

  const [autenticado, setAutenticado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const response = await fetch('/api/scout/favorito', { cache: 'no-store' })
        if (!response.ok) throw new Error()
        const data = await response.json()
        if (!active) return
        setAutenticado(data.autenticado)
        setFavoritado((data.autenticado ? data.favoritos : getFavoritos()).includes(atletaId))
        setMounted(true)
      } catch { if (active) setError(true) }
    }
    void load()
    return () => { active = false }
  }, [atletaId])

  async function handleToggle() {
    setError(false)
    if (autenticado) {
      setSaving(true)
      try {
        const response = await fetch('/api/scout/favorito', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ atletaId, favoritado: !favoritado }),
        })
        if (!response.ok) throw new Error()
        setFavoritado((await response.json()).favoritado)
      } catch { setError(true) } finally { setSaving(false) }
      return
    }
    const atual = getFavoritos()
    const novo  = atual.includes(atletaId)
      ? atual.filter(id => id !== atletaId)
      : [...atual, atletaId]
    setFavoritos(novo)
    setFavoritado(novo.includes(atletaId))
  }

  // Evita flash de hidratação
  if (!mounted && error) return <span role="status">Favoritos indisponíveis</span>
  if (!mounted) return (
    <div style={{ width: '50px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)' }} />
  )

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      aria-pressed={favoritado}
      aria-label={error ? 'Falha ao salvar favorito. Tentar novamente' : undefined}
      title={favoritado ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '6px',
        padding:        '12px 18px',
        borderRadius:   '12px',
        border:         favoritado
          ? '1.5px solid rgba(251,191,36,0.5)'
          : '1.5px solid rgba(255,255,255,0.12)',
        background: favoritado
          ? 'rgba(251,191,36,0.1)'
          : 'rgba(255,255,255,0.04)',
        color:      favoritado ? '#fbbf24' : 'rgba(255,255,255,0.45)',
        fontWeight: 700,
        fontSize:   '13px',
        cursor:     'pointer',
        transition: 'all .2s',
        flexShrink: 0,
        fontFamily: 'system-ui, sans-serif',
        minWidth:   '50px',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>
        {error ? '!' : favoritado ? '⭐' : '☆'}
      </span>
    </button>
  )
}
