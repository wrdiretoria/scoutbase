// Server Component — dados reais do Supabase
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMap } from '@/lib/ovr'

// ── Types ──────────────────────────────────────────────────────────────────────

type ProspectData = {
  id:         string
  athleteId:  string | null
  nome:       string
  posicao:    string
  pos:        string
  cidade:     string
  idade:      number | null
  ovr:        number
  initials:   string
  foto:       string | null
  highlight:  string
  stats:      { label: string; val: number }[]
  badge:      string
  badgeColor: string
  trend:      string
  topColor:   string
  avatarGrad: string
  glow:       string
  glowHover:  string
  accent:     string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function calcIdade(dataNasc: string | null): number | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let age = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) age--
  return age
}

function getStats(posicao: string, av: Record<string, unknown>) {
  const v = (n: unknown) => Math.round((typeof n === 'number' ? n : 0) * 10)
  const p = posicao.toLowerCase()
  if (p.includes('goleiro')) return [
    { label: 'Posicionam.', val: v(av.posicionamento) },
    { label: 'Técnica',     val: v(av.tecnica) },
    { label: 'Força',       val: v(av.forca) },
  ]
  if (p.includes('zagueiro')) return [
    { label: 'Posicionam.', val: v(av.posicionamento) },
    { label: 'Força',       val: v(av.forca) },
    { label: 'Técnica',     val: v(av.tecnica) },
  ]
  if (p.includes('volante')) return [
    { label: 'Visão de jogo', val: v(av.visao_jogo) },
    { label: 'Força',         val: v(av.forca) },
    { label: 'Técnica',       val: v(av.tecnica) },
  ]
  if (p.includes('meia')) return [
    { label: 'Visão de jogo', val: v(av.visao_jogo) },
    { label: 'Técnica',       val: v(av.tecnica) },
    { label: 'Posicionam.',   val: v(av.posicionamento) },
  ]
  // atacante, ponta, avante, lateral, default
  return [
    { label: 'Finalização', val: v(av.finalizacao) },
    { label: 'Velocidade',  val: v(av.velocidade) },
    { label: 'Técnica',     val: v(av.tecnica) },
  ]
}

function getHighlight(ovr: number, rank: number, cidade: string): string {
  const city = cidade ? cidade.split(',')[0] : ''
  if (rank === 1) return `Top 1 do ranking · OVR ${ovr}`
  if (ovr >= 88)  return city ? `${city} · OVR ${ovr}` : `Elite global · OVR ${ovr}`
  if (ovr >= 80)  return city ? `${city} · Top ${rank}` : `Alto nível · OVR ${ovr}`
  return city ? `${city} · Top ${rank}` : `Top ${rank} no ranking`
}

const PALETTES = [
  { badge: 'PROMESSA #1', badgeColor: '#f59e0b', topColor: 'linear-gradient(160deg,#0d3a1a 0%,#061209 100%)', avatarGrad: 'linear-gradient(145deg,#065f28,#00e87a)', glow: 'rgba(0,255,136,0.18)', glowHover: 'rgba(0,255,136,0.32)', accent: '#00FF88' },
  { badge: 'DESTAQUE',    badgeColor: '#a78bfa', topColor: 'linear-gradient(160deg,#1e0d42 0%,#0c0520 100%)', avatarGrad: 'linear-gradient(145deg,#5b21b6,#a78bfa)', glow: 'rgba(139,92,246,0.15)', glowHover: 'rgba(139,92,246,0.28)', accent: '#a78bfa' },
  { badge: 'EM ASCENSÃO', badgeColor: '#38bdf8', topColor: 'linear-gradient(160deg,#082840 0%,#040e1a 100%)', avatarGrad: 'linear-gradient(145deg,#075985,#38bdf8)', glow: 'rgba(56,189,248,0.14)', glowHover: 'rgba(56,189,248,0.26)', accent: '#38bdf8' },
  { badge: 'TALENTO',     badgeColor: '#fb923c', topColor: 'linear-gradient(160deg,#42180a 0%,#160700 100%)', avatarGrad: 'linear-gradient(145deg,#c2410c,#fb923c)', glow: 'rgba(251,146,60,0.14)', glowHover: 'rgba(251,146,60,0.26)', accent: '#fb923c' },
]

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchTopProspects(): Promise<ProspectData[]> {
  try {
    const admin = createAdminClient()

    // Top avaliações ordenadas por scout_score
    const { data: avs } = await admin
      .from('avaliacoes')
      .select('aluno_id, scout_score, velocidade, tecnica, visao_jogo, finalizacao, forca, posicionamento')
      .not('scout_score', 'is', null)
      .order('scout_score', { ascending: false })
      .limit(20)

    if (!avs || avs.length === 0) return []

    // Deduplicar: melhor avaliação por atleta, top 4
    const seen = new Set<string>()
    const topAvs: typeof avs = []
    for (const av of avs) {
      if (seen.has(av.aluno_id as string)) continue
      seen.add(av.aluno_id as string)
      topAvs.push(av)
      if (topAvs.length === 4) break
    }

    const ids = topAvs.map(av => av.aluno_id as string)

    const [profilesRes, authData, ovrMap] = await Promise.all([
      admin.from('profiles').select('id, nome, avatar_url, fotos, data_nascimento, athlete_id').in('id', ids),
      admin.auth.admin.listUsers({ perPage: 1000 }),
      fetchOvrMap(admin),
    ])

    const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id as string, p]))
    const posMap    = new Map<string, string>()
    const cidadeMap = new Map<string, string>()
    for (const u of authData.data?.users ?? []) {
      if (u.user_metadata?.posicao) posMap.set(u.id, u.user_metadata.posicao as string)
      if (u.user_metadata?.cidade)  cidadeMap.set(u.id, u.user_metadata.cidade as string)
    }

    return topAvs.map((av, i) => {
      const id      = av.aluno_id as string
      const profile = profileMap.get(id)
      const nome    = (profile?.nome as string | null) ?? 'Atleta'
      const posicao = posMap.get(id) ?? 'Atleta'
      const cidade  = cidadeMap.get(id) ?? ''
      const dataNasc = (profile?.data_nascimento as string | null) ?? null
      const mcId    = (profile?.athlete_id as string | null) ?? null
      const ovr     = (mcId ? ovrMap.get(mcId) : null) ?? Math.round(av.scout_score as number)

      const fotosArr = profile?.fotos as (string | null)[] | null
      const foto = fotosArr?.[0] ?? (profile?.avatar_url as string | null) ?? null

      const palette = PALETTES[i] ?? PALETTES[PALETTES.length - 1]
      const trend   = `+${Math.max(1, ovr - 75)}`

      return {
        id,
        athleteId: (profile?.athlete_id as string | null) ?? null,
        nome,
        posicao,
        pos:       posAbrev(posicao),
        cidade,
        idade:     calcIdade(dataNasc),
        ovr,
        initials:  getInitials(nome),
        foto,
        highlight: getHighlight(ovr, i + 1, cidade),
        stats:     getStats(posicao, av as Record<string, unknown>),
        badge:     palette.badge,
        badgeColor: palette.badgeColor,
        trend,
        topColor:  palette.topColor,
        avatarGrad: palette.avatarGrad,
        glow:      palette.glow,
        glowHover: palette.glowHover,
        accent:    palette.accent,
      }
    })
  } catch {
    return []
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default async function ProspectsSection() {
  const prospects = await fetchTopProspects()

  if (prospects.length === 0) return null

  return (
    <section style={{
      position: 'relative',
      padding: '88px 0 80px',
      background: '#060d08',
      overflow: 'hidden',
    }}>
      <style>{`
        /* ── Atmosphere ── */
        .pros-atmo {
          position:absolute; inset:0; pointer-events:none; z-index:0;
          background:radial-gradient(ellipse at 80% 20%, rgba(0,40,20,0.28) 0%, transparent 50%),
                     radial-gradient(ellipse at 20% 80%, rgba(0,255,136,0.04) 0%, transparent 40%);
        }

        /* ── Header ── */
        .pros-header {
          position:relative; z-index:1;
          text-align:center; margin-bottom:56px; padding:0 24px;
        }
        .pros-micro {
          display:inline-flex; align-items:center; gap:7px;
          font-size:10px; font-weight:800; letter-spacing:0.22em;
          color:#00FF88; text-transform:uppercase; margin:0 0 16px;
        }
        .pros-h2 {
          font-size:clamp(26px,3.6vw,42px); font-weight:900;
          letter-spacing:-0.03em; color:white; line-height:1.08; margin:0;
        }
        .pros-sub {
          margin:12px auto 0; font-size:14.5px;
          color:rgba(255,255,255,0.36); max-width:420px; line-height:1.65;
        }

        /* ── Grid ── */
        .prospects-grid {
          position:relative; z-index:1;
          display:grid;
          grid-template-columns:repeat(4, 1fr);
          gap:22px;
          max-width:1200px;
          margin:0 auto;
          padding:0 40px;
        }

        /* ── Card ── */
        .prospect-card {
          position:relative;
          border-radius:22px;
          overflow:hidden;
          background:#09150c;
          border:1px solid rgba(255,255,255,0.07);
          transition:transform 0.28s cubic-bezier(.22,1,.36,1), box-shadow 0.28s ease, border-color 0.28s ease;
          cursor:pointer;
          -webkit-tap-highlight-color:transparent;
        }
        .prospect-card:hover {
          transform:translateY(-10px) scale(1.018);
          border-color:rgba(255,255,255,0.13);
        }
        .prospect-card:active { transform:translateY(-4px) scale(1.008) !important; }

        /* ── Card inner shine ── */
        @keyframes prosShine {
          0%,15%  { left:-80% }
          60%,100% { left:150% }
        }
        .prospect-card::after {
          content:''; pointer-events:none;
          position:absolute; top:0; bottom:0; width:38%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent);
          transform:skewX(-16deg);
          animation:prosShine 10s ease-in-out infinite;
          z-index:5;
        }

        /* ── Top header area ── */
        .pros-card-top {
          position:relative; padding:24px 20px 0;
          min-height:148px;
          display:flex; flex-direction:column; align-items:center;
        }

        /* ── Badge ── */
        .pros-badge {
          position:absolute; top:14px; left:50%; transform:translateX(-50%);
          background:rgba(0,0,0,0.55); backdrop-filter:blur(8px);
          border-radius:20px; padding:4px 11px;
          font-size:8px; font-weight:800; letter-spacing:0.12em;
          white-space:nowrap;
        }

        /* ── Score block ── */
        .pros-score-wrap {
          display:flex; align-items:flex-end; gap:7px;
          margin-top:36px; margin-bottom:18px;
        }
        .pros-score {
          font-size:66px; font-weight:900; line-height:0.9;
          color:white; letter-spacing:-0.045em;
          text-shadow:0 4px 24px rgba(0,0,0,0.7);
          font-variant-numeric:tabular-nums;
        }
        .pros-pos {
          font-size:12px; font-weight:800; letter-spacing:0.10em;
          color:rgba(255,255,255,0.45); margin-bottom:8px;
        }

        /* ── Avatar divider ── */
        .pros-avatar-wrap {
          display:flex; justify-content:center;
          margin-top:-38px; position:relative; z-index:2;
        }
        .pros-avatar {
          width:76px; height:76px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:22px; font-weight:900; color:white;
          border:3px solid #09150c;
          position:relative; overflow:hidden;
        }
        .pros-avatar::after {
          content:''; pointer-events:none;
          position:absolute; top:-30%; left:-25%;
          width:50%; height:50%;
          background:radial-gradient(ellipse, rgba(255,255,255,0.22), transparent 70%);
        }

        /* ── Bottom content ── */
        .pros-card-body { padding:14px 20px 24px; }

        /* Name + trend row */
        .pros-name-row {
          display:flex; align-items:center;
          justify-content:space-between; margin-bottom:4px;
        }
        .pros-name {
          font-size:15px; font-weight:800; color:white;
          letter-spacing:0.01em; margin:0; line-height:1.2;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
          max-width:140px;
        }
        .pros-trend {
          display:flex; align-items:center; gap:3px; flex-shrink:0;
          background:rgba(0,255,136,0.09);
          border:1px solid rgba(0,255,136,0.28);
          border-radius:20px; padding:3px 9px;
          box-shadow:0 0 8px rgba(0,255,136,0.08);
        }
        .pros-trend-arrow { font-size:10px; color:#00FF88; line-height:1; }
        .pros-trend-val   { font-size:10.5px; font-weight:800; color:#00FF88; letter-spacing:0.02em; }

        /* Meta line */
        .pros-meta {
          margin:0 0 14px; font-size:11px;
          color:rgba(255,255,255,0.32); letter-spacing:0.02em;
        }

        /* Highlight box */
        .pros-highlight {
          border-radius:10px; padding:9px 12px; margin-bottom:16px;
          background:rgba(255,255,255,0.035);
          border:1px solid rgba(255,255,255,0.06);
        }
        .pros-highlight p { margin:0; font-size:11px; color:rgba(255,255,255,0.50); line-height:1.45; }

        /* Stats */
        .pros-stats { display:flex; flex-direction:column; gap:8px; }
        .pros-stat-row { display:flex; align-items:center; gap:8px; }
        .pros-stat-label {
          font-size:10px; color:rgba(255,255,255,0.28);
          width:80px; flex-shrink:0; letter-spacing:0.01em;
        }
        .pros-stat-bar {
          flex:1; height:3px; background:rgba(255,255,255,0.07); border-radius:3px; overflow:hidden;
        }
        .pros-stat-fill { height:100%; border-radius:3px; }
        .pros-stat-val {
          font-size:11px; font-weight:800; color:rgba(255,255,255,0.85);
          min-width:24px; text-align:right;
        }

        /* ── CTA ── */
        .pros-cta-wrap {
          position:relative; z-index:1;
          text-align:center; margin-top:52px;
        }
        .pros-cta {
          display:inline-flex; align-items:center; gap:8px;
          color:#22c55e; font-size:14px; font-weight:700;
          text-decoration:none; letter-spacing:0.02em;
          border-bottom:1px solid rgba(34,197,94,0.28); padding-bottom:2px;
          transition:color 0.2s, border-color 0.2s;
        }
        .pros-cta:hover { color:#00FF88; border-color:rgba(0,255,136,0.6); }

        /* ── Responsive ── */
        @media (max-width:1024px) {
          .prospects-grid { grid-template-columns:repeat(2,1fr) !important; }
        }
        @media (max-width:640px) {
          .prospects-grid { grid-template-columns:1fr !important; padding:0 20px !important; }
          .pros-h2 { font-size:24px !important; }
          .pros-score { font-size:58px !important; }
        }
      `}</style>

      {/* Atmosphere */}
      <div className="pros-atmo" aria-hidden />

      {/* ── Header ── */}
      <div className="pros-header">
        <p className="pros-micro">
          🔥 Perfis em evidência
        </p>
        <h2 className="pros-h2">Promessas em destaque</h2>
        <p className="pros-sub">
          Atletas reais. Perfis verificados. Vistos por scouts agora.
        </p>
      </div>

      {/* ── Cards ── */}
      <div
        className="prospects-grid"
        style={{ gridTemplateColumns: `repeat(${Math.min(prospects.length, 4)}, 1fr)` }}
      >
        {prospects.map((p) => (
          <div
            key={p.id}
            className="prospect-card"
            style={{
              boxShadow: `0 0 40px ${p.glow}, 0 20px 48px rgba(0,0,0,0.55)`,
              ['--hover-glow' as string]: p.glowHover,
            }}
          >
            {/* Link invisível sobre o card → perfil do atleta */}
            <Link
              href={`/jogador/${p.id}`}
              style={{ position: 'absolute', inset: 0, zIndex: 10 }}
              aria-label={`Ver perfil de ${p.nome}`}
            />

            {/* TOP area */}
            <div className="pros-card-top" style={{ background: p.topColor }}>
              {/* Accent line */}
              <div style={{
                position: 'absolute', top: 0, left: '18%', right: '18%',
                height: '1.5px', borderRadius: '0 0 4px 4px',
                background: `linear-gradient(90deg, transparent, ${p.accent}88, transparent)`,
              }} aria-hidden />

              {/* Badge */}
              <div
                className="pros-badge"
                style={{ color: p.badgeColor, border: `1px solid ${p.badgeColor}40` }}
              >
                {p.badge}
              </div>

              {/* Score + Position */}
              <div className="pros-score-wrap">
                <span className="pros-score">{p.ovr}</span>
                <span className="pros-pos">{p.pos}</span>
              </div>
            </div>

            {/* Avatar */}
            <div className="pros-avatar-wrap">
              <div
                className="pros-avatar"
                style={{
                  background: p.foto ? '#09150c' : p.avatarGrad,
                  boxShadow: `0 8px 28px ${p.glow}, 0 0 0 3px #09150c`,
                }}
              >
                {p.foto ? (
                  <img
                    src={p.foto}
                    alt={p.nome}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover', objectPosition: 'center top',
                    }}
                  />
                ) : p.initials}
              </div>
            </div>

            {/* BODY */}
            <div className="pros-card-body">
              {/* Name + Trend */}
              <div className="pros-name-row">
                <p className="pros-name">{p.nome}</p>
                <div className="pros-trend">
                  <span className="pros-trend-arrow">↑</span>
                  <span className="pros-trend-val">{p.trend}</span>
                </div>
              </div>

              {/* Meta */}
              <p className="pros-meta">
                {p.posicao}
                {p.cidade && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 6px' }}>·</span>
                    {p.cidade.split(',')[0]}
                  </>
                )}
                {p.idade && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 6px' }}>·</span>
                    {p.idade} anos
                  </>
                )}
              </p>

              {/* Highlight */}
              <div
                className="pros-highlight"
                style={{ borderLeft: `2px solid ${p.badgeColor}60` }}
              >
                <p>{p.highlight}</p>
              </div>

              {/* Stats */}
              <div className="pros-stats">
                {p.stats.map((s) => (
                  <div key={s.label} className="pros-stat-row">
                    <span className="pros-stat-label">{s.label}</span>
                    <div className="pros-stat-bar">
                      <div
                        className="pros-stat-fill"
                        style={{ width: `${s.val}%`, background: p.avatarGrad }}
                      />
                    </div>
                    <span className="pros-stat-val">{s.val}</span>
                  </div>
                ))}
              </div>

              {/* ID do atleta */}
              {p.athleteId && (
                <div style={{
                  marginTop: '12px', textAlign: 'center',
                  padding: '5px 10px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '10px', fontWeight: 800,
                  color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em',
                }}>
                  ID: {p.athleteId.replace('MC-', '')}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div className="pros-cta-wrap">
        <a href="/cadastro" className="pros-cta">
          Criar meu perfil e entrar no ranking →
        </a>
      </div>
    </section>
  )
}
