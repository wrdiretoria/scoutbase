'use client'

import { useState, useEffect } from 'react'

interface Props {
  fotos:    string[]   // URLs não-nulas, pode ser []
  nome:     string
  initials: string
  ovrColor: string     // cor do tier para as iniciais de fallback
}

/**
 * Exibe fotos ciclando a cada 2s com fade suave (sem controles visíveis).
 * - 2+ fotos → cicla automaticamente
 * - 1 foto   → exibe estática
 * - 0 fotos  → exibe iniciais com fundo escuro esportivo
 */
export default function PhotoCycler({ fotos, nome, initials, ovrColor }: Props) {
  const [idx,     setIdx]     = useState(0)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    if (fotos.length <= 1) return
    const timer = setInterval(() => {
      setOpacity(0)
      setTimeout(() => {
        setIdx(p => (p + 1) % fotos.length)
        setOpacity(1)
      }, 350)
    }, 2000)
    return () => clearInterval(timer)
  }, [fotos.length])

  if (fotos.length === 0) {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg,#0d1f14,#1a4a2a)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '60px', fontWeight: 900,
        color: ovrColor, opacity: 0.4,
        userSelect: 'none',
      }}>
        {initials}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fotos[idx]}
      alt={nome}
      style={{
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'top center',
        opacity,
        transition: 'opacity 0.35s ease',
        display: 'block',
      }}
    />
  )
}
