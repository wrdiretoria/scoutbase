import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Meu Craque — Perfil Oficial de Atleta de Futebol'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #06100a 0%, #0d1f14 100%)',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.06)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(34,197,94,0.05)',
            display: 'flex',
          }}
        />

        {/* Green accent bar */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 160,
            width: 6,
            height: 260,
            background: 'linear-gradient(180deg, #22c55e, #16a34a)',
            borderRadius: 4,
            display: 'flex',
          }}
        />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 30 }}>
          {/* Brand */}
          <div
            style={{
              fontSize: 76,
              fontWeight: 900,
              color: '#22c55e',
              letterSpacing: '-2px',
              lineHeight: 1,
              marginBottom: 16,
              display: 'flex',
            }}
          >
            MEU CRAQUE
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 32,
              color: '#bbf7d0',
              marginBottom: 12,
              display: 'flex',
            }}
          >
            Perfil Oficial de Atleta de Futebol
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 24,
              color: '#86efac',
              opacity: 0.8,
              marginBottom: 48,
              display: 'flex',
            }}
          >
            Crie seu perfil · Receba avaliações · Seja descoberto
          </div>

          {/* Pills */}
          <div style={{ display: 'flex', gap: 16 }}>
            {['🏆 Ranking', '🔍 Scout busca', '⚽ Perfil grátis'].map((label) => (
              <div
                key={label}
                style={{
                  background: 'rgba(34,197,94,0.15)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 24,
                  padding: '10px 24px',
                  fontSize: 20,
                  color: '#22c55e',
                  display: 'flex',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* URL bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 110,
            fontSize: 22,
            color: '#4ade80',
            opacity: 0.6,
            display: 'flex',
          }}
        >
          meucraque.com.br
        </div>

        {/* Ball emoji right side */}
        <div
          style={{
            position: 'absolute',
            right: 100,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 180,
            opacity: 0.12,
            display: 'flex',
          }}
        >
          ⚽
        </div>
      </div>
    ),
    { ...size }
  )
}
