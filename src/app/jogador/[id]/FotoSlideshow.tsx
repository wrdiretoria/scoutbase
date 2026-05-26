'use client'

import { useState, useEffect } from 'react'

type Props = {
  fotos: string[]
  nome: string
}

/**
 * Cicla pelas fotos do atleta de 2 em 2 segundos com fade suave.
 * Se só houver 1 foto, exibe estática sem intervalo.
 */
export default function FotoSlideshow({ fotos, nome }: Props) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (fotos.length <= 1) return
    const timer = setInterval(() => {
      setIdx(i => (i + 1) % fotos.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [fotos.length])

  if (fotos.length === 0) return null

  return (
    <img
      key={idx}
      src={fotos[idx]}
      alt={nome}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center top',
        animation: 'photoFadeIn 0.4s ease forwards',
      }}
    />
  )
}
