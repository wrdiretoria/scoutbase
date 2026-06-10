'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const navLinks = [
  { label: '🏆 Ranking',    href: '/ranking' },
  { label: 'Para atletas',  href: '/login' },
  { label: 'Para treinadores',  href: '/login' },
  { label: '🔍 Para scouts', href: '/scout/busca' },
  { label: 'Planos',        href: '/planos' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const searchRef = useRef<HTMLInputElement>(null)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = searchQuery.trim()
    if (!q) return
    router.push(`/ranking?q=${encodeURIComponent(q)}`)
    setSearchQuery('')
  }

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (installPrompt as any).prompt()
    setShowInstall(false)
    setInstallPrompt(null)
  }

  return (
    <>
      <style>{`
        .nav-link-d { color:rgba(255,255,255,0.65); text-decoration:none; font-size:14px; font-weight:500; transition:color .2s; white-space:nowrap; }
        .nav-link-d:hover { color:white; }
        .hamburger-btn { display:none; background:none; border:none; cursor:pointer; padding:8px; }
        .nav-desktop-links { display:flex; align-items:center; gap:24px; flex:1; justify-content:center; }
        .nav-desktop-btns { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .nav-search-form { display:flex; align-items:center; flex:1; max-width:320px; }
        .nav-search-input {
          width:100%; padding:8px 14px; border-radius:20px;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
          color:white; font-size:13px; outline:none;
          transition:border-color .2s, background .2s;
        }
        .nav-search-input::placeholder { color:rgba(255,255,255,0.35); }
        .nav-search-input:focus { border-color:rgba(0,255,136,0.45); background:rgba(255,255,255,0.10); }
        @media (max-width: 768px) {
          .hamburger-btn { display:flex !important; align-items:center; justify-content:center; }
          .nav-desktop-links { display:none !important; }
          .nav-desktop-btns { display:none !important; }
          .nav-search-form { display:none !important; }
        }
      `}</style>

      {/* ─── MAIN NAV BAR ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        height: '64px',
        background: 'rgba(6,16,10,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 24px',
          width: '100%', display: 'flex', alignItems: 'center', gap: '24px',
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>⚽</span>
            <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.01em' }}>
              <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
            </span>
          </Link>

          {/* Search bar */}
          <form className="nav-search-form" onSubmit={handleSearch}>
            <input
              ref={searchRef}
              className="nav-search-input"
              type="search"
              placeholder="Buscar atleta, posição, cidade ou ID"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Buscar atleta"
            />
          </form>

          {/* Desktop links */}
          <div className="nav-desktop-links">
            {navLinks.map(l => (
              <Link key={l.label} href={l.href} className="nav-link-d">{l.label}</Link>
            ))}
          </div>

          {/* Sino + Desktop buttons */}
          <div className="nav-desktop-btns">
            {/* Ícone sino */}
            <button aria-label="Notificações" style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.50)', padding: '6px', display: 'flex', alignItems: 'center',
              transition: 'color .2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </button>
            <Link href="/login" style={{
              padding: '8px 20px', fontSize: '14px', fontWeight: 600,
              color: 'white', border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: '10px', textDecoration: 'none',
            }}>
              Entrar
            </Link>
            <Link href="/login" style={{
              padding: '8px 20px', fontSize: '14px', fontWeight: 700,
              color: 'black', background: '#00e676', borderRadius: '10px', textDecoration: 'none',
            }}>
              Começar agora
            </Link>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="hamburger-btn"
            onClick={() => setOpen(o => !o)}
            aria-label="Menu"
            style={{ marginLeft: 'auto' }}
          >
            {open ? (
              <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ─── MOBILE MENU OVERLAY ─── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', top: '64px', left: 0, right: 0, bottom: 0,
            zIndex: 199,
            background: 'rgba(6,16,10,0.98)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            padding: '32px 28px',
            gap: '0',
            overflowY: 'auto',
          }}
        >
          {/* Campo de busca mobile */}
          <form onSubmit={handleSearch} style={{ marginBottom: '8px' }}>
            <input
              className="nav-search-input"
              type="search"
              placeholder="Buscar atleta, posição, cidade ou ID"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label="Buscar atleta"
              style={{
                width: '100%', padding: '14px 18px', borderRadius: '14px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                color: 'white', fontSize: '16px', outline: 'none',
              }}
            />
          </form>

          {/* Nav links */}
          {navLinks.map((l, i) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                color: l.href === '/ranking' ? '#22c55e' : 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                fontSize: '22px',
                fontWeight: 600,
                padding: '18px 0',
                borderBottom: i < navLinks.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                display: 'block',
                letterSpacing: '-0.01em',
              }}
            >
              {l.label}
            </Link>
          ))}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '36px' }}>
            {showInstall && (
              <button
                onClick={handleInstall}
                style={{
                  padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: 700,
                  color: 'white', background: 'rgba(0,255,136,0.1)',
                  border: '1.5px solid rgba(0,255,136,0.35)',
                  borderRadius: '14px', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                📲 Instalar app
              </button>
            )}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: 600,
                color: 'white', border: '1.5px solid rgba(255,255,255,0.25)',
                borderRadius: '14px', textDecoration: 'none', display: 'block',
              }}
            >
              Entrar
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                padding: '16px', textAlign: 'center', fontSize: '16px', fontWeight: 700,
                color: 'black', background: '#22c55e', borderRadius: '14px',
                textDecoration: 'none', display: 'block',
              }}
            >
              Começar agora →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
