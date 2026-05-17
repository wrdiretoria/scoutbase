'use client'

/**
 * Botão de favorito para scouts — aparece na página pública do atleta.
 * Só funciona se o usuário logado for um scout (tipo = 'scout').
 * Zero-schema: IDs salvos em user_metadata.favoritos do scout.
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function FavoritoButton({ atletaId }: { atletaId: string }) {
  const [isScout,     setIsScout]     = useState(false)
  const [favoritado,  setFavoritado]  = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [toggling,    setToggling]    = useState(false)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const tipo = user.user_metadata?.tipo as string | undefined
      if (tipo !== 'scout') { setLoading(false); return }

      setIsScout(true)

      // Verifica se já favoritado
      const favoritos: string[] = (user.user_metadata?.favoritos as string[] | null) ?? []
      setFavoritado(favoritos.includes(atletaId))
      setLoading(false)
    }
    check()
  }, [atletaId])

  async function handleToggle() {
    if (toggling) return
    setToggling(true)
    try {
      const res = await fetch('/api/scout/favorito', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ atletaId }),
      })
      if (res.ok) {
        const json = await res.json() as { favoritado: boolean }
        setFavoritado(json.favoritado)
      }
    } catch { /* silencia */ }
    setToggling(false)
  }

  if (loading || !isScout) return null

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
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
        cursor:     toggling ? 'wait' : 'pointer',
        transition: 'all .2s',
        flexShrink: 0,
        fontFamily: 'system-ui, sans-serif',
        minWidth:   '50px',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: '16px', lineHeight: 1 }}>
        {favoritado ? '⭐' : '☆'}
      </span>
      <span style={{ display: 'none' }}>
        {favoritado ? 'Salvo' : 'Salvar'}
      </span>
    </button>
  )
}
