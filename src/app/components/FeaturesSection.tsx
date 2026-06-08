// Server Component

const features = [
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#00FF88" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
      </svg>
    ),
    tag: 'AVALIAÇÕES',
    title: 'Seja avaliado por treinadores',
    desc: 'Receba avaliações reais de treinadores cadastrados e ganhe visibilidade no ranking global.',
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#00FF88" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"/>
      </svg>
    ),
    tag: 'RANKING',
    title: 'Suba no ranking global',
    desc: 'Compita por posição, idade e região. Seja o número 1 do mundo na sua posição.',
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#00FF88" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
      </svg>
    ),
    tag: 'OPORTUNIDADES',
    title: 'Encontre testes e peneiras',
    desc: 'Conecte-se diretamente com clubes, escolinhas e scouts que buscam novos talentos.',
  },
  {
    icon: (
      <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#00FF88" strokeWidth="1.6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
      </svg>
    ),
    tag: 'REDE',
    title: 'Construa sua rede no futebol',
    desc: 'Conecte-se com atletas, treinadores, clubes e empresários do futebol brasileiro.',
  },
]

export default function FeaturesSection() {
  return (
    <section style={{
      background: '#080f09',
      borderTop: '1px solid rgba(0,255,136,0.08)',
      padding: '72px 0 80px',
    }}>
      <style>{`
        .feat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 24px;
          gap: 0;
          align-items: start;
        }
        .feat-card {
          padding: 32px 24px 36px;
          border-right: 1px solid rgba(0,255,136,0.08);
          transition: background .2s;
        }
        .feat-card:last-child { border-right: none; }
        .feat-card:hover { background: rgba(0,255,136,0.03); }
        .feat-more {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 700; color: rgba(0,255,136,0.7);
          text-decoration: none; letter-spacing: 0.08em;
          margin-top: 20px;
          transition: color .2s;
        }
        .feat-more:hover { color: #00FF88; }
        @media (max-width: 900px) {
          .feat-grid { grid-template-columns: 1fr 1fr !important; }
          .feat-card:nth-child(2) { border-right: none; }
          .feat-card { border-bottom: 1px solid rgba(0,255,136,0.08); }
          .feat-card:nth-last-child(-n+2) { border-bottom: none; }
        }
        @media (max-width: 500px) {
          .feat-grid { grid-template-columns: 1fr !important; padding: 0 !important; }
          .feat-card { border-right: none !important; border-bottom: 1px solid rgba(0,255,136,0.08) !important; }
          .feat-card:last-child { border-bottom: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '52px', padding: '0 24px' }}>
        <p style={{
          fontSize: '10px', fontWeight: 800, letterSpacing: '0.22em',
          color: 'rgba(0,255,136,0.72)', marginBottom: '12px',
          textTransform: 'uppercase',
        }}>⚽ &nbsp;POR QUE O MEUCRAQUE</p>
        <h2 style={{
          fontSize: 'clamp(24px,4vw,40px)', fontWeight: 900,
          letterSpacing: '-0.03em', lineHeight: 1.1,
          margin: 0,
        }}>
          Tudo que você precisa<br />
          <span style={{ color: '#00FF88' }}>para ser descoberto.</span>
        </h2>
      </div>

      <div className="feat-grid">
        {features.map((f) => (
          <div key={f.tag} className="feat-card">
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'rgba(0,255,136,0.07)',
              border: '1px solid rgba(0,255,136,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              {f.icon}
            </div>
            <p style={{
              fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em',
              color: 'rgba(0,255,136,0.65)', marginBottom: '8px',
              textTransform: 'uppercase',
            }}>{f.tag}</p>
            <h3 style={{
              fontSize: '16px', fontWeight: 800, color: 'white',
              lineHeight: 1.3, margin: '0 0 10px', letterSpacing: '-0.01em',
            }}>{f.title}</h3>
            <p style={{
              fontSize: '13px', color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.65, margin: 0,
            }}>{f.desc}</p>
            <a href="/login" className="feat-more">
              SAIBA MAIS &nbsp;→
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
