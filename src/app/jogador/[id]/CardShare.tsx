'use client'

import { useEffect, useRef, useState } from 'react'
import { generateCard, type CanvasCardProps } from '@/lib/canvasCard'

// Re-exporta para compatibilidade com código externo
export type { CanvasCardProps as CardShareProps }

// ── Componente principal ───────────────────────────────────────────────────────

export default function CardShare(props: CanvasCardProps) {
  const [open,  setOpen]  = useState(false)
  const [ready, setReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!open) return
    setReady(false)
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    generateCard(canvas, props).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `card-${props.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <>
      {/* ── Botão trigger ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '13px 16px',
          borderRadius: '14px',
          background: 'rgba(0,255,136,0.07)',
          border: '1.5px solid rgba(0,255,136,0.28)',
          color: '#00FF88',
          fontWeight: 800, fontSize: '14px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          letterSpacing: '0.02em',
          transition: 'background .18s',
          fontFamily: 'system-ui, sans-serif',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.13)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.07)')}
      >
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ flexShrink: 0 }}>
          <rect x="2" y="5" width="20" height="14" rx="3"/>
          <path strokeLinecap="round" d="M2 10h20"/>
        </svg>
        Meu Card
        {props.ovr && (
          <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>
            OVR {props.ovr}
          </span>
        )}
      </button>

      {/* ── Modal ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'flex-start',
            padding: '20px 20px 40px', overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(0,255,136,0.7)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'system-ui' }}>
                  {props.ovr ? `OVR ${props.ovr}` : 'Sem avaliação'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '16px', fontWeight: 800, color: 'white', fontFamily: 'system-ui' }}>
                  Meu Card
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.55)', fontSize: '20px',
                  cursor: 'pointer', fontFamily: 'system-ui',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            {/* Canvas preview — 320px wide → canvas 400x700 → 320x560 exibido */}
            <div style={{
              position: 'relative', width: '100%',
              borderRadius: '16px',
              boxShadow: '0 0 40px rgba(0,255,136,0.20), 0 16px 48px rgba(0,0,0,0.80)',
            }}>
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '16px', opacity: ready ? 1 : 0, transition: 'opacity .35s ease' }}
              />
              {!ready && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: '#080f0a',
                  border: '1px solid rgba(0,255,136,0.18)',
                  borderRadius: '22px', minHeight: '220px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    border: '2.5px solid rgba(0,255,136,0.3)',
                    borderTopColor: '#00FF88',
                    animation: 'cardSpin .7s linear infinite',
                  }} />
                  <style>{`@keyframes cardSpin { to { transform: rotate(360deg) } }`}</style>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui' }}>
                    Gerando card...
                  </p>
                </div>
              )}
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={!ready}
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: '14px',
                background: ready
                  ? 'linear-gradient(135deg,#00ee7e 0%,#00c855 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${ready ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.07)'}`,
                color: ready ? '#020c05' : 'rgba(255,255,255,0.18)',
                fontWeight: 800, fontSize: '14px',
                cursor: ready ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all .2s',
                fontFamily: 'system-ui',
              }}
            >
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              {ready ? 'Baixar PNG' : 'Gerando...'}
            </button>

            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.16)', textAlign: 'center', fontFamily: 'system-ui' }}>
              Salve o PNG e compartilhe no story, status ou WhatsApp
            </p>
          </div>
        </div>
      )}
    </>
  )
}
