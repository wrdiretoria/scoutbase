'use client'

/**
 * Wrapper client-side para <img> nos cards de atleta da landing.
 * Oculta a imagem via onError — deixa as iniciais aparecerem quando a foto falhar.
 */
export default function CardPhoto({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={(e) => { e.currentTarget.style.display = 'none' }}
    />
  )
}
