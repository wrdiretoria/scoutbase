'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <main style={{
      background: 'var(--mc-canvas)',
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'inherit',
      color: 'white',
      padding: '24px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '320px' }}>
        {/* Ícone */}
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'rgba(34,197,94,0.08)',
          border: '1.5px solid rgba(34,197,94,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '32px',
        }}>
          📶
        </div>

        <Link href="/" aria-label="MeuCraque, início" style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em' }} className="inline-block no-underline text-inherit">
          ⚽ <span style={{ color: 'var(--mc-accent)' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
        </Link>

        <h1 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 900, letterSpacing: '-0.02em' }}>
          Sem conexão
        </h1>

        <p style={{ margin: '0 0 32px', fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>
          Você está offline. Conecte-se à internet para acessar o Meu Craque.
        </p>

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '14px 32px',
            borderRadius: '14px',
            background: '#b3f737',
            color: 'black',
            fontWeight: 800,
            fontSize: '15px',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Tentar novamente
        </button>
      </div>
    </main>
  )
}
