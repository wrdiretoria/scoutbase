'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const SUBS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => `Sub-${n}`)

const LINHA1 = [
  { label: 'Zagueiros',  query: 'Zagueiro' },
  { label: 'Lat. Esq',   query: 'Lateral Esquerdo' },
  { label: 'Lat. Dir',   query: 'Lateral Direito' },
]

const LINHA2 = [
  { label: 'Volantes',       query: 'Volante' },
  { label: 'Meias',          query: 'Meia' },
  { label: 'Atacantes',      query: 'Atacante' },
  { label: 'Centro-Avantes', query: 'Centro-Avante' },
]

const TODAS_POSICOES = [...LINHA1, ...LINHA2]

function CategoryNavInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)

  const catAtiva = params.get('categoria') ?? null
  const posAtiva = params.get('posicao')   ?? null

  // Categoria selecionada mas sem posição — aguardando escolha
  const aguardandoPos = !!catAtiva && !posAtiva

  function buildUrl(newCat: string | null, newPos: string | null) {
    const p = new URLSearchParams()
    if (newCat) p.set('categoria', newCat)
    if (newPos) p.set('posicao',   newPos)
    return `/ranking${p.toString() ? '?' + p.toString() : ''}`
  }

  function toggleCat(cat: string) {
    // Ao selecionar categoria, limpa posição — obriga escolher
    router.push(buildUrl(catAtiva === cat ? null : cat, null))
    setOpen(false)
  }

  function selectPos(query: string) {
    router.push(buildUrl(catAtiva, posAtiva === query ? null : query))
  }

  return (
    <nav style={{ background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 40 }}>
      <style>{`
        .cat-nav::-webkit-scrollbar { display: none; }
        .cat-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 9px 14px;
          font-size: 13px; font-weight: 600;
          color: rgba(255,255,255,0.50);
          white-space: nowrap; border-bottom: 2px solid transparent;
          transition: color .15s, border-color .15s;
          cursor: pointer; background: none;
          border-top: none; border-left: none; border-right: none;
          font-family: inherit;
        }
        .cat-pill:hover { color: rgba(255,255,255,0.90); border-bottom-color: rgba(0,255,136,0.30); }
        .cat-pill-active { color: #00e676 !important; border-bottom-color: #00e676 !important; }

        /* Linha 2 em estado de espera — pulsa suavemente para chamar atenção */
        @keyframes pulseGreen {
          0%, 100% { border-color: rgba(0,230,118,0.15); }
          50%       { border-color: rgba(0,230,118,0.50); }
        }
        .linha2-waiting {
          animation: pulseGreen 1.5s ease-in-out infinite;
          border-top: 1px solid rgba(0,230,118,0.15) !important;
        }
        .linha2-waiting .cat-pill { color: rgba(255,255,255,0.75) !important; }

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

      {/* ── Linha 1 ── */}
      <div className="cat-nav" style={{ display: 'flex', maxWidth: '1280px', margin: '0 auto', padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <button
          className={`cat-pill${catAtiva ? ' cat-pill-active' : ''}`}
          onClick={() => setOpen(o => !o)}
        >
          {catAtiva ?? 'Categorias'} {open ? '▲' : '▼'}
        </button>

        {LINHA1.map(({ label, query }) => (
          <button
            key={label}
            className={`cat-pill${posAtiva === query ? ' cat-pill-active' : ''}`}
            onClick={() => selectPos(query)}
          >
            {label}
          </button>
        ))}
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

      {/* ── Linha 2 — pulsa quando aguardando posição ── */}
      <div className={aguardandoPos ? 'linha2-waiting' : ''} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: '#0a0a0a', transition: 'border-color .3s' }}>
        {aguardandoPos && (
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '4px 16px 0', fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em', color: '#00e676', textTransform: 'uppercase' }}>
            ↓ Escolha a posição
          </div>
        )}
        <div className="cat-nav" style={{ display: 'flex', maxWidth: '1280px', margin: '0 auto', padding: '0 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {LINHA2.map(({ label, query }) => (
            <button
              key={label}
              className={`cat-pill${posAtiva === query ? ' cat-pill-active' : ''}`}
              onClick={() => selectPos(query)}
            >
              {label}
            </button>
          ))}
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
