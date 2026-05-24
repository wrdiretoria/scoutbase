'use client'

/**
 * Componente client para exibir a foto do atleta com fallback automático.
 * Necessário porque CardCraqueSection é Server Component e não suporta onError.
 */
export function AtletaFoto({
  src,
  alt,
  style,
  fallback = '/images/hero-player.png',
}: {
  src: string | null
  alt: string
  style?: React.CSSProperties
  fallback?: string
}) {
  return (
    <img
      src={src ?? fallback}
      alt={alt}
      onError={e => {
        const img = e.currentTarget
        if (img.src !== fallback) img.src = fallback
      }}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center 12%',
        display: 'block',
        ...style,
      }}
    />
  )
}
