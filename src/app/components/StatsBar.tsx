'use client'

/**
 * StatsBar — métricas reais em tempo real (Client Component, polling 30s)
 */

import { useEffect, useState } from 'react'

export default function StatsBar() {
  const [atletasCount, setAtletasCount]       = useState<number | null>(null)
  const [avaliacoesCount, setAvaliacoesCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/landing/stats', { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json() as { atletasCount: number; avaliacoesCount: number }
        setAtletasCount(json.atletasCount)
        setAvaliacoesCount(json.avaliacoesCount)
      } catch { /* mantém estado anterior */ }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30_000)
    return () => clearInterval(interval)
  }, [])

  const stats = [
    {
      value: atletasCount == null ? '…' : atletasCount > 0 ? atletasCount.toLocaleString('pt-BR') : 'GRÁTIS',
      label: atletasCount != null && atletasCount > 0 ? 'Atletas cadastrados' : 'Para sempre, para atletas',
    },
    {
      value: avaliacoesCount == null ? '…' : avaliacoesCount > 0 ? avaliacoesCount.toLocaleString('pt-BR') : '—',
      label: 'Avaliações realizadas',
    },
    { value: '3 MIN', label: 'Para criar seu perfil' },
    { value: '24/7',  label: 'Visível para scouts'   },
  ]

  return (
    <div style={{
      background: 'linear-gradient(180deg, #060d08 0%, #0a1a0c 100%)',
      borderTop: '1px solid rgba(0,255,136,0.1)',
      borderBottom: '1px solid rgba(0,255,136,0.06)',
    }}>
      <style>{`
        .stats-bar-grid {
          display: grid;
          grid-template-columns: repeat(4,1fr);
          max-width: 1100px;
          margin: 0 auto;
        }
        .stats-bar-item {
          padding: 28px 24px;
          border-right: 1px solid rgba(0,255,136,0.08);
          display: flex; align-items: center; gap: 14px;
        }
        .stats-bar-item:last-child { border-right: none; }
        @keyframes fadeCount {
          from { opacity: 0.4; transform: translateY(4px); }
          to   { opacity: 1;   transform: translateY(0);   }
        }
        .stats-count-animate { animation: fadeCount 0.4s ease-out; }
        @media (max-width: 768px) {
          .stats-bar-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-bar-item:nth-child(2) { border-right: none; }
          .stats-bar-item:nth-child(3) { border-right: 1px solid rgba(0,255,136,0.08); }
          .stats-bar-item { padding: 20px 18px !important; }
        }
      `}</style>

      <div className="stats-bar-grid">
        {stats.map((s, i) => (
          <div key={i} className="stats-bar-item">
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
              background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" fill="none" stroke="#00FF88" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <div
                key={s.value}
                className="stats-count-animate"
                style={{
                  fontSize: '20px', fontWeight: 900, color: '#00FF88',
                  letterSpacing: '-0.02em', lineHeight: 1,
                  textShadow: '0 0 20px rgba(0,255,136,0.4)',
                }}
              >
                {s.value}
              </div>
              <div style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.38)',
                marginTop: '3px', letterSpacing: '0.02em',
              }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
