'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const SUBS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => `Sub-${n}`)

const POSICOES = ['Goleiros','Zagueiros','Laterais','Volantes','Meias','Atacantes']

const POSICAO_QUERY: Record<string, string> = {
  'Goleiros':  'Goleiro',
  'Zagueiros': 'Zagueiro',
  'Laterais':  'Lateral',
  'Volantes':  'Volante',
  'Meias':     'Meia',
  'Atacantes': 'Atacante',
}

function CategoryNavInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)

  const catAtiva = params.get('categoria') ?? null
  const posAtiva = params.get('posicao')   ?? null

  function buildUrl(newCat: string | null, newPos: string | null) {
    const p = new URLSearchParams()
    if (newCat) p.set('categoria', newCat)
    if (newPos) p.set('posicao',   newPos)
    return `/ranking${p.toString() ? '?' + p.toString() : ''}`
  }

  function toggleCat(cat: string) {
    const next = catAtiva === cat ? null : cat
    router.push(buildUrl(next, posAtiva))
    setOpen(false)
  }

  function togglePos(pos: string) {
    const query = POSICAO_QUERY[pos]
    const next  = posAtiva === query ? null : query
    router.push(buildUrl(catAtiva, next))
  }

  return (
    <nav style={{ background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 40 }}>
      <style>{`
        .cat-nav::-webkit-scrollbar { display: none; }
        .cat-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 10px 16px;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.50);
          text-decoration: none; white-space: nowrap;
          border-bottom: 2px solid transparent;
          transition: color .15s, border-color .15s;
          cursor: pointer; background: none;
          border-top: none; border-left: none; border-right: none;
          font-family: inherit;
        }
        .cat-pill:hover { color: rgba(255,255,255,0.90); border-bottom-color: rgba(0,255,136,0.30); }
        .cat-pill-active { color: #00e676 !important; border-bottom-color: #00e676 !important; }
        .pos-pill {
          display: inline-flex; align-items: center;
          padding: 6px 16px; border-radius: 20px;
          font-size: 12px; font-weight: 700;
          color: rgba(255,255,255,0.55);
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.10);
          white-space: nowrap; cursor: pointer;
          transition: background .15s, color .15s, border-color .15s;
        }
        .pos-pill:hover { background: rgba(0,230,118,0.10); color: #00e676; border-color: rgba(0,230,118,0.30); }
        .pos-pill-active { background: rgba(0,230,118,0.15) !important; color: #00e676 !important; border-color: rgba(0,230,118,0.50) !important; }
        .cat-dropdown {
          position: absolute; top: 100%; left: 0; right: 0;
          background: #111;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex; flex-wrap: wrap; gap: 6px;
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
          cursor: pointer;
          transition: background .15s, color .15s, border-color .15s;
        }
        .cat-sub-pill:hover  { background: rgba(0,230,118,0.12); color: #00e676; border-color: rgba(0,230,118,0.35); }
        .cat-sub-pill-active { background: rgba(0,230,118,0.18) !important; color: #00e676 !important; border-color: rgba(0,230,118,0.55) !important; }
      `}</style>

      {/* Linha 1: Categoria */}
      <div className="cat-nav" style={{ display: 'flex', maxWidth: '1280px', margin: '0 auto', padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          className={`cat-pill${catAtiva ? ' cat-pill-active' : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          {catAtiva ?? 'Categorias'} {open ? '▲' : '▼'}
        </button>
      </div>

      {/* Dropdown Sub-6 → Sub-20 */}
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div className="cat-dropdown">
            {SUBS.map(s => (
              <button
                key={s}
                className={`cat-sub-pill${catAtiva === s ? ' cat-sub-pill-active' : ''}`}
                onClick={() => toggleCat(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Linha 2: Posição */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0a0a0a' }}>
        <div className="cat-nav" style={{ display: 'flex', gap: '8px', maxWidth: '1280px', margin: '0 auto', padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {POSICOES.map(pos => {
            const query = POSICAO_QUERY[pos]
            const ativo = posAtiva === query
            return (
              <button
                key={pos}
                className={`pos-pill${ativo ? ' pos-pill-active' : ''}`}
                onClick={() => togglePos(pos)}
              >
                {pos}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default function CategoryNav() {
  return (
    <Suspense fallback={
      <nav style={{ background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.06)', height: '80px' }} />
    }>
      <CategoryNavInner />
    </Suspense>
  )
}
