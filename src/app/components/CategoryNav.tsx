'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const CATEGORIAS = [
  { label: 'Todos',      href: '/ranking' },
  { label: 'Destaques',  href: '/ranking?sort=ovr' },
  { label: 'Ranking',    href: '/ranking' },
  { label: 'Atacantes',  href: '/ranking?posicao=Atacante' },
  { label: 'Meias',      href: '/ranking?posicao=Meia' },
  { label: 'Zagueiros',  href: '/ranking?posicao=Zagueiro' },
  { label: 'Goleiros',   href: '/ranking?posicao=Goleiro' },
  { label: 'Sub-13',     href: '/ranking?categoria=Sub-13' },
  { label: 'Sub-15',     href: '/ranking?categoria=Sub-15' },
  { label: 'Sub-17',     href: '/ranking?categoria=Sub-17' },
  { label: 'Sub-20',     href: '/ranking?categoria=Sub-20' },
]

export default function CategoryNav() {
  return (
    <nav
      aria-label="Categorias"
      style={{
        background: '#080808',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
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
        }
        .cat-pill:hover { color: rgba(255,255,255,0.90); border-bottom-color: rgba(0,255,136,0.40); }
        .cat-pill-active { color: #00e676 !important; border-bottom-color: #00e676 !important; }
      `}</style>
      <div
        className="cat-nav"
        style={{
          display: 'flex',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px',
          gap: '0',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {CATEGORIAS.map(cat => (
          <Link key={cat.label} href={cat.href} className="cat-pill">
            {cat.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
