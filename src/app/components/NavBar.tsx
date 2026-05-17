'use client'

import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: '🏆 Ranking',    href: '/ranking' },
  { label: 'Para atletas',  href: '/atleta/cadastro' },
  { label: 'Para escolas',  href: '/treinador/cadastro' },
  { label: '🔍 Para scouts', href: '/scout/busca' },
  { label: 'Planos',        href: '#' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <style>{`
        .nav-link-d { color:rgba(255,255,255,0.65); text-decoration:none; font-size:14px; font-weight:500; transition:color .2s; white-space:nowrap; }
        .nav-link-d:hover { color:white; }
        .hamburger-btn { display:none; background:none; border:none; cursor:pointer; padding:8px; }
        .nav-desktop-links { display:flex; align-items:center; gap:24px; flex:1; justify-content:center; }
        .nav-desktop-btns { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        @media (max-width: 768px) {
          .hamburger-btn { display:flex !important; align-items:center; justify-content:center; }
          .nav-desktop-links { display:none !important; }
          .nav-desktop-btns { display:none !important; }
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
            <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '0.04em', color: 'white' }}>MEU </span>
            <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '0.04em', color: '#22c55e' }}>CRAQUE</span>
          </Link>

          {/* Desktop links */}
          <div className="nav-desktop-links">
            {navLinks.map(l => (
              <Link key={l.label} href={l.href} className="nav-link-d">{l.label}</Link>
            ))}
          </div>

          {/* Desktop buttons */}
          <div className="nav-desktop-btns">
            <Link href="/login" style={{
              padding: '8px 20px', fontSize: '14px', fontWeight: 600,
              color: 'white', border: '1.5px solid rgba(255,255,255,0.3)',
              borderRadius: '10px', textDecoration: 'none',
            }}>
              Entrar
            </Link>
            <Link href="/atleta/cadastro" style={{
              padding: '8px 20px', fontSize: '14px', fontWeight: 700,
              color: 'black', background: '#22c55e', borderRadius: '10px', textDecoration: 'none',
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
              href="/atleta/cadastro"
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
