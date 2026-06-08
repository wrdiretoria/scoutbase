'use client'

import Link from 'next/link'
import { useState } from 'react'

const ITENS = [
  { label: 'Todos',      href: '/ranking' },
  { label: 'Destaques',  href: '/ranking?sort=ovr' },
  { label: 'Ranking',    href: '/ranking' },
  { label: 'Atacantes',  href: '/ranking?posicao=Atacante' },
  { label: 'Meias',      href: '/ranking?posicao=Meia' },
  { label: 'Zagueiros',  href: '/ranking?posicao=Zagueiro' },
  { label: 'Goleiros',   href: '/ranking?posicao=Goleiro' },
]

const SUBS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => ({
  label: `Sub-${n}`,
  href: `/ranking?categoria=Sub-${n}`,
}))

export default function CategoryNav() {
  const [open, setOpen] = useState(false)

  return (
    <nav
      aria-label="Categorias"
      style={{
        background: '#080808',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        zIndex: 40,
      }}
    >
      <style>{`
        .cat-nav::-webkit-scrollbar { display: none; }
        .cat-pill {
          display: inline-flex; align-items: center;
          padding: 10px 18px;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.50);
          text-decoration: none; white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: color .18s, border-color .18s;
          cursor: pointer; background: none; border-top: none;
          border-left: none; border-right: none; font-family: inherit;
        }
        .cat-pill:hover { color: rgba(255,255,255,0.90); border-bottom-color: rgba(0,255,136,0.40); }
        .cat-pill-active { color: #00e676 !important; border-bottom-color: #00e676 !important; }
        .cat-dropdown {
          position: absolute;
          top: 100%;
          left: 0; right: 0;
          background: #111;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; flex-wrap: wrap; gap: 4px;
          padding: 12px 24px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
          z-index: 50;
        }
        .cat-sub-pill {
          display: inline-flex; align-items: center;
          padding: 6px 14px; border-radius: 20px;
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.60);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          text-decoration: none; white-space: nowrap;
          transition: background .15s, color .15s, border-color .15s;
        }
        .cat-sub-pill:hover {
          background: rgba(0,230,118,0.12);
          color: #00e676;
          border-color: rgba(0,230,118,0.35);
        }
      `}</style>

      <div
        className="cat-nav"
        style={{
          display: 'flex',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {ITENS.map(cat => (
          <Link key={cat.label} href={cat.href} className="cat-pill">
            {cat.label}
          </Link>
        ))}

        {/* Botão CATEGORIAS com dropdown */}
        <button
          className={`cat-pill${open ? ' cat-pill-active' : ''}`}
          onClick={() => setOpen(o => !o)}
          style={{ borderBottom: open ? '2px solid #00e676' : '2px solid transparent' }}
        >
          Categorias {open ? '▲' : '▼'}
        </button>
      </div>

      {/* Dropdown com Sub-6 até Sub-20 */}
      {open && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div className="cat-dropdown">
            {SUBS.map(s => (
              <Link
                key={s.label}
                href={s.href}
                className="cat-sub-pill"
                onClick={() => setOpen(false)}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </>
      )}
    </nav>
  )
}
