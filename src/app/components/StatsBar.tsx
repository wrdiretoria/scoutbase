/**
 * StatsBar — métricas reais do banco (Server Component)
 */

import { createAdminClient } from '@/lib/supabase'

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

export default async function StatsBar() {
  let atletasCount = 0
  let avaliacoesCount = 0

  try {
    const admin = createAdminClient()
    const [usersRes, avsRes] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      admin.from('avaliacoes').select('id', { count: 'exact', head: true }),
    ])
    atletasCount    = (usersRes.data?.users ?? []).filter(u => u.user_metadata?.tipo === 'atleta').length
    avaliacoesCount = avsRes.count ?? 0
  } catch { /* static fallback */ }

  const stats = [
    {
      value: atletasCount > 0 ? atletasCount.toLocaleString('pt-BR') : 'GRÁTIS',
      label: atletasCount > 0 ? 'Atletas cadastrados' : 'Para sempre, para atletas',
    },
    { value: avaliacoesCount > 0 ? avaliacoesCount.toLocaleString('pt-BR') : '—', label: 'Avaliações realizadas' },
    { value: '3 MIN', label: 'Para criar seu perfil' },
    { value: '24/7', label: 'Visível para scouts' },
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: '20px', fontWeight: 900, color: '#00FF88',
                letterSpacing: '-0.02em', lineHeight: 1,
                textShadow: '0 0 20px rgba(0,255,136,0.4)',
              }}>{s.value}</div>
              <div style={{
                fontSize: '11px', color: 'rgba(255,255,255,0.38)',
                marginTop: '3px', letterSpacing: '0.02em',
              }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
