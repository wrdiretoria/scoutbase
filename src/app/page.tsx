import Link from 'next/link'

const navLinks = [
  'Para atletas',
  'Para treinadores',
  'Para responsáveis',
  'Para scouts',
  'Recursos',
  'Planos',
]

const cards = [
  {
    icon: '📋',
    title: 'Para treinadores',
    desc: 'Gestão completa da sua equipe e evolução dos atletas.',
    highlight: true,
  },
  {
    icon: '👟',
    title: 'Para atletas',
    desc: 'Evolua seu jogo, ganhe destaque e seja visto por quem importa.',
    highlight: false,
  },
  {
    icon: '👨‍👩‍👦',
    title: 'Para responsáveis',
    desc: 'Acompanhe cada passo do seu filho com segurança e clareza.',
    highlight: false,
  },
  {
    icon: '🔍',
    title: 'Para scouts',
    desc: 'Encontre novos talentos de forma rápida e eficiente.',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div style={{ background: '#06100a', color: 'white', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-14px); }
        }
        @keyframes floatBack {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .nav-link { color: rgba(255,255,255,0.65); text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: white; }
        .card-hover { transition: background 0.2s; }
        .card-hover:hover { background: rgba(34,197,94,0.04); }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px',
        background: 'rgba(6,16,10,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 40px', width: '100%', display: 'flex', alignItems: 'center', gap: '40px' }}>
          {/* Logo */}
          <span style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '0.04em', flexShrink: 0 }}>
            <span style={{ color: 'white' }}>MEU </span>
            <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </span>

          {/* Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flex: 1, justifyContent: 'center' }}>
            {navLinks.map((l) => (
              <a key={l} href="#" className="nav-link">
                {l}
              </a>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <Link href="/login" style={{
              padding: '8px 20px', fontSize: '14px', fontWeight: 600, color: 'white',
              border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '10px',
              textDecoration: 'none', transition: 'border-color 0.2s',
            }}>
              Entrar
            </Link>
            <Link href="/cadastro" style={{
              padding: '8px 20px', fontSize: '14px', fontWeight: 700, color: 'black',
              background: '#22c55e', borderRadius: '10px', textDecoration: 'none',
            }}>
              Começar agora
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {/* Background photo */}
        <img
          src="https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1920&q=90"
          alt=""
          aria-hidden
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            zIndex: 0,
          }}
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to right, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.10) 100%)',
        }} />

        {/* Grid */}
        <div style={{
          position: 'relative', zIndex: 2,
          height: '100%',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          padding: '0 80px',
          gap: '40px',
          maxWidth: '1300px',
          margin: '0 auto',
        }}>

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Badge */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 16px', borderRadius: '100px',
              border: '1.5px solid rgba(34,197,94,0.5)',
              background: 'rgba(34,197,94,0.08)',
              fontSize: '12px', fontWeight: 700,
              color: '#22c55e', letterSpacing: '0.04em',
              width: 'fit-content',
            }}>
              ⭐ A PLATAFORMA #1 PARA O FUTEBOL DE BASE
            </span>

            {/* H1 */}
            <h1 style={{
              fontSize: 'clamp(48px, 5vw, 72px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 1.0,
              color: 'white',
              margin: 0,
            }}>
              <span style={{ display: 'block' }}>A jornada completa</span>
              <span style={{ display: 'block' }}>de quem vive</span>
              <em style={{ display: 'block', color: '#22c55e', fontStyle: 'italic' }}>o futebol.</em>
            </h1>

            {/* Subtitle */}
            <p style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.6,
              margin: 0,
              maxWidth: '460px',
            }}>
              Gestão, evolução e visibilidade para transformar treino em oportunidades reais.
            </p>

            {/* CTA Button */}
            <div>
              <Link href="/cadastro" style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px',
                background: '#22c55e', color: 'black',
                fontWeight: 800, fontSize: '18px',
                borderRadius: '12px', padding: '16px 32px',
                textDecoration: 'none',
              }}>
                <span style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(0,0,0,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0,
                }}>↗</span>
                Começar minha jornada
              </Link>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: '520px', height: '580px' }}>

              {/* ── PHONE FRONT ── */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, zIndex: 2,
                width: '240px',
                borderRadius: '36px',
                background: '#1a1a1a',
                padding: '10px 8px',
                boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(255,255,255,0.12)',
                animation: 'float 5s ease-in-out infinite',
              }}>
                <div style={{ background: 'white', borderRadius: '26px', overflow: 'hidden', padding: '14px' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>RS</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: '#111' }}>Olá, Rafael! 👋</p>
                      <p style={{ margin: 0, fontSize: '9px', color: '#888' }}>Sub-17 · Meia</p>
                    </div>
                    <span style={{ fontSize: '14px' }}>🔔</span>
                  </div>

                  {/* Green card */}
                  <div style={{ background: '#16a34a', borderRadius: '14px', padding: '10px 12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '8px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Presenças</p>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'white' }}>18/20</p>
                      <p style={{ margin: 0, fontSize: '8px', color: 'rgba(255,255,255,0.75)' }}>90%</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '8px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>Avaliação média</p>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'white' }}>8,7</p>
                      <p style={{ margin: 0, fontSize: '9px', color: '#fbbf24' }}>★★★★★</p>
                    </div>
                  </div>

                  {/* Next event */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8f8f8', borderRadius: '10px', padding: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px' }}>📅</span>
                    <div>
                      <p style={{ margin: 0, fontSize: '8px', fontWeight: 700, color: '#111' }}>Treino · Terça, 21/05 · 18:00</p>
                      <p style={{ margin: 0, fontSize: '8px', color: '#888' }}>CT Arena Society</p>
                    </div>
                  </div>

                  {/* Chart */}
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px', marginBottom: '8px' }}>
                    {[55, 65, 60, 75, 100].map((h, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        {i === 4 && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#16a34a' }} />}
                        <div style={{ width: '100%', height: `${h}%`, borderRadius: '4px 4px 0 0', background: i === 4 ? '#16a34a' : '#e5e7eb' }} />
                      </div>
                    ))}
                  </div>

                  {/* Recent */}
                  {[['18/05', '8,7'], ['11/05', '8,0']].map(([d, v]) => (
                    <div key={d} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: '8px', color: '#888' }}>{d}</span>
                      <span style={{ fontSize: '8px', fontWeight: 700, color: '#111' }}>{v}</span>
                    </div>
                  ))}

                  {/* Bottom nav */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
                    {[['🏠', 'Início', true], ['📅', 'Agenda', false], ['📈', 'Desempenho', false], ['💬', 'Mensagens', false], ['···', 'Mais', false]].map(([icon, label, active]) => (
                      <div key={String(label)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ fontSize: '11px' }}>{String(icon)}</span>
                        <span style={{ fontSize: '7px', color: active ? '#16a34a' : '#aaa', fontWeight: active ? 700 : 400 }}>{String(label)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── PHONE BACK ── */}
              <div style={{
                position: 'absolute', top: 0, right: 0, zIndex: 1,
                width: '210px',
                opacity: 0.88,
                borderRadius: '36px',
                background: '#1a1a1a',
                padding: '10px 8px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(255,255,255,0.10)',
                animation: 'floatBack 5s ease-in-out infinite 0.6s',
              }}>
                <div style={{ background: 'white', borderRadius: '26px', overflow: 'hidden', padding: '12px' }}>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#888' }}>← Ranking</span>
                    <span style={{ fontSize: '11px' }}>🔍</span>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'hidden' }}>
                    {['Geral', 'Meia', 'Atacante', 'Zagueiro', 'Goleiro'].map((t, i) => (
                      <span key={t} style={{
                        fontSize: '7px', fontWeight: 700, padding: '3px 6px', borderRadius: '20px', flexShrink: 0,
                        background: i === 0 ? '#16a34a' : '#f3f4f6',
                        color: i === 0 ? 'white' : '#888',
                      }}>{t}</span>
                    ))}
                  </div>

                  {/* Podium */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '6px', marginBottom: '10px' }}>
                    {/* 2nd */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', margin: '0 auto 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#555' }}>LP</div>
                      <p style={{ margin: 0, fontSize: '7px', color: '#555', fontWeight: 600 }}>Lucas P.</p>
                      <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#111' }}>8,8</p>
                      <div style={{ width: '36px', height: '24px', background: '#d1d5db', borderRadius: '4px 4px 0 0', margin: '2px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '8px', fontWeight: 700, color: '#666' }}>2</span>
                      </div>
                    </div>
                    {/* 1st */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fbbf24', margin: '0 auto 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: 'white', border: '2px solid #f59e0b' }}>RS 👑</div>
                      <p style={{ margin: 0, fontSize: '7px', color: '#111', fontWeight: 700 }}>Rafael S.</p>
                      <p style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: '#111' }}>9,1</p>
                      <div style={{ width: '36px', height: '32px', background: '#fbbf24', borderRadius: '4px 4px 0 0', margin: '2px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'white' }}>1</span>
                      </div>
                    </div>
                    {/* 3rd */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', margin: '0 auto 2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#555' }}>GM</div>
                      <p style={{ margin: 0, fontSize: '7px', color: '#555', fontWeight: 600 }}>Gabriel M.</p>
                      <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: '#111' }}>8,6</p>
                      <div style={{ width: '36px', height: '18px', background: '#d97706', borderRadius: '4px 4px 0 0', margin: '2px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '8px', fontWeight: 700, color: 'white' }}>3</span>
                      </div>
                    </div>
                  </div>

                  {/* List */}
                  {[
                    { pos: 4, name: 'Nicolas L.', score: '8,4', highlight: false },
                    { pos: 5, name: 'Pedro H.', score: '8,3', highlight: false },
                    { pos: 12, name: 'Rafael Silva', score: '8,0', highlight: true },
                    { pos: 13, name: 'João V.', score: '7,9', highlight: false },
                    { pos: 14, name: 'Matheus R.', score: '7,8', highlight: false },
                  ].map((r) => (
                    <div key={r.pos} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '3px 5px', borderRadius: '6px', marginBottom: '2px',
                      background: r.highlight ? 'rgba(34,197,94,0.1)' : 'transparent',
                    }}>
                      <span style={{ fontSize: '7px', color: '#888', width: '14px' }}>#{r.pos}</span>
                      <span style={{ fontSize: '8px', fontWeight: r.highlight ? 700 : 500, color: r.highlight ? '#16a34a' : '#333', flex: 1, paddingLeft: '4px' }}>{r.name}</span>
                      <span style={{ fontSize: '8px', fontWeight: 700, color: '#111' }}>{r.score}</span>
                    </div>
                  ))}

                  {/* Bottom nav */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #f3f4f6' }}>
                    {[['🏠', false], ['🔍', false], ['🏆', true], ['💬', false], ['···', false]].map(([icon, active], i) => (
                      <span key={i} style={{ fontSize: String(icon) === '···' ? '10px' : '12px', opacity: active ? 1 : 0.4, color: active ? '#16a34a' : 'inherit' }}>{String(icon)}</span>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── CARDS BAR ─── */}
      <div style={{ background: '#080e09', borderTop: '1px solid rgba(34,197,94,0.15)' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {cards.map((c, i) => (
            <div key={c.title} style={{
              padding: '28px',
              borderRight: i < 3 ? '1px solid rgba(34,197,94,0.1)' : 'none',
            }}
            className="card-hover"
            >
              <span style={{ fontSize: '24px', display: 'block', marginBottom: '10px' }}>{c.icon}</span>
              <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 700, color: c.highlight ? '#22c55e' : 'white' }}>{c.title}</p>
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{c.desc}</p>
              {c.highlight && (
                <a href="#" style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>Saiba mais ›</a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: '#06100a', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 40px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.04em' }}>
            <span style={{ color: 'white' }}>MEU </span>
            <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </span>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
            © {new Date().getFullYear()} Meu Craque. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}
