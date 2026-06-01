'use client'

import { useEffect, useRef, useState } from 'react'

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const duration = 1800
          const start = Date.now()
          const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            // Ease-out cubic
            const ease = 1 - Math.pow(1 - progress, 3)
            setCount(Math.round(ease * target))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return <div ref={ref}>{count}{suffix}</div>
}

const stats = [
  { target: 500, suffix: '+', label: 'atletas',     desc: 'no radar'         },
  { target: 100, suffix: '+', label: 'avaliações',  desc: 'realizadas'       },
  { target: 20,  suffix: '+', label: 'treinadores', desc: 'certificados'     },
  { target: 10,  suffix: '+', label: 'estados',     desc: 'representados'    },
]

export default function StatsSection() {
  return (
    <section style={{ background: '#030905', padding: '88px 24px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            margin: '0 0 14px',
            fontSize: 'clamp(26px,3.6vw,44px)',
            fontWeight: 900, color: 'white',
            letterSpacing: '-0.03em', lineHeight: 1.06,
          }}>
            Uma comunidade que cresce
          </h2>
          <p style={{
            margin: '0 auto', fontSize: 'clamp(14px,1.1vw,16px)',
            color: 'rgba(255,255,255,0.35)', maxWidth: '400px', lineHeight: 1.6,
          }}>
            Números reais de uma plataforma em expansão pelo Brasil.
          </p>
        </div>

        {/* Stats grid */}
        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}>
          {stats.map(s => (
            <div key={s.label} style={{
              textAlign: 'center',
              padding: '36px 20px',
              borderRadius: '20px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Subtle green glow top */}
              <div style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: '60%', height: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.30), transparent)',
                pointerEvents: 'none',
              }} />

              <div style={{
                fontSize: 'clamp(38px,4.5vw,56px)',
                fontWeight: 900, color: '#00FF88',
                lineHeight: 1, letterSpacing: '-0.04em',
                marginBottom: '10px',
                textShadow: '0 0 24px rgba(0,255,136,0.25)',
              }}>
                <AnimatedCounter target={s.target} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.02em' }}>
                {s.desc}
              </div>
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 400px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }
        }
      `}</style>
    </section>
  )
}
