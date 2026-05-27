// Server Component — card do atleta em destaque para o hero
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { AtletaFoto } from './AtletaFoto'

type CardData = {
  nome: string; posicao: string; athlete_id: string
  foto: string | null; ovr: number; treinadorNome: string
  userId: string; cardStats: [string, string][]
}

const FALLBACK: CardData = {
  nome: 'Rafael Silva', posicao: 'MEI', athlete_id: '04729',
  foto: null, ovr: 87, treinadorNome: 'Carlos Mendes', userId: '',
  cardStats: [['VEL','90'],['FIN','85'],['TEC','88'],['VIS','82'],['FOR','78'],['POS','87']],
}

async function fetchCardData(): Promise<CardData> {
  try {
    const admin = createAdminClient()

    const { data: av } = await admin
      .from('avaliacoes')
      .select('aluno_id, professor_id, scout_score, velocidade, tecnica, visao_jogo, finalizacao, forca, posicionamento')
      .not('scout_score', 'is', null)
      .order('scout_score', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!av || !av.aluno_id) return FALLBACK

    const { data: profile } = await admin
      .from('profiles')
      .select('nome, athlete_id, fotos, avatar_url')
      .eq('id', av.aluno_id as string)
      .maybeSingle()

    const { data: { user: atletaUser } } = await admin.auth.admin.getUserById(av.aluno_id as string)
    const posicao = (atletaUser?.user_metadata?.posicao as string | null) ?? 'ATL'

    const { data: tProfile } = await admin
      .from('profiles')
      .select('nome')
      .eq('id', av.professor_id as string)
      .maybeSingle()

    const fotosArr = profile?.fotos as (string | null)[] | null
    const foto = fotosArr?.[0] ?? (profile?.avatar_url as string | null) ?? null

    const v   = (n: unknown) => Math.round((typeof n === 'number' ? n : 0) * 10)
    const ovr = Math.round(av.scout_score as number)

    const posAbrev = (pos: string) => {
      const m: Record<string,string> = {
        'Goleiro':'GK','Lateral Direito':'LD','Lateral Esquerdo':'LE',
        'Zagueiro':'ZG','Volante':'VOL','Meia':'MEI','Meia-Atacante':'MAT',
        'Ponta Direita':'PD','Ponta Esquerda':'PE','Atacante':'ATA','Centro-Avante':'CA',
      }
      return m[pos] ?? pos.slice(0,3).toUpperCase()
    }

    return {
      nome:          (profile?.nome as string | null) ?? 'Atleta',
      posicao:       posAbrev(posicao),
      athlete_id:    (profile?.athlete_id as string | null)?.replace(/^[A-Z]+-/,'') ?? '—',
      foto,
      ovr,
      treinadorNome: (tProfile?.nome as string | null) ?? 'Treinador',
      userId:        av.aluno_id as string,
      cardStats: [
        ['VEL', String(v(av.velocidade))],
        ['FIN', String(v(av.finalizacao))],
        ['TEC', String(v(av.tecnica))],
        ['VIS', String(v(av.visao_jogo))],
        ['FOR', String(v(av.forca))],
        ['POS', String(v(av.posicionamento))],
      ],
    }
  } catch {
    return FALLBACK
  }
}

export default async function HeroCard() {
  const data = await fetchCardData()
  const { nome, posicao, athlete_id, foto, ovr, treinadorNome, cardStats, userId } = data

  const tier = ovr >= 85
    ? { label: 'OURO',   card: 'linear-gradient(160deg,#2a1a00 0%,#1e1200 55%,#0e0900 100%)', border: 'rgba(212,168,67,0.55)',  glow: 'rgba(212,168,67,0.30)',  ovr: '#f0c040', accent: '#d4a843', badge: 'linear-gradient(135deg,#b8860b,#f0c040)' }
    : ovr >= 70
    ? { label: 'PRATA',  card: 'linear-gradient(160deg,#1a1a1f 0%,#111118 55%,#08080e 100%)', border: 'rgba(192,192,210,0.45)', glow: 'rgba(180,180,200,0.22)', ovr: '#d0d0e8', accent: '#a0a0c0', badge: 'linear-gradient(135deg,#707080,#c0c0d8)' }
    : { label: 'BRONZE', card: 'linear-gradient(160deg,#1f1008 0%,#140b05 55%,#0a0603 100%)', border: 'rgba(180,100,40,0.50)',  glow: 'rgba(180,100,40,0.22)', ovr: '#d4804a', accent: '#c87040', badge: 'linear-gradient(135deg,#7a3a10,#d4804a)' }

  return (
    <>
      <style>{`
        @keyframes heroCardFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes heroCardShimmer {
          0%   { left: -80% }
          100% { left: 160% }
        }
        .hero-card-anim { animation: heroCardFloat 5s ease-in-out infinite; }
        .hero-card-anim:hover { animation-play-state: paused; }
        .hero-card-shimmer {
          position: absolute; top: 0; bottom: 0; width: 50%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transform: skewX(-18deg);
          animation: heroCardShimmer 4s ease-in-out infinite 2s;
          pointer-events: none;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>

        {/* Rótulo destaque */}
        <span style={{
          fontSize: '9px', fontWeight: 800, color: tier.accent,
          letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          ⭐ DESTAQUE DA SEMANA
        </span>

        {/* Card flutuante */}
        <div className="hero-card-anim" style={{
          width: '220px',
          background: tier.card,
          borderRadius: '22px',
          border: `1.5px solid ${tier.border}`,
          overflow: 'hidden',
          boxShadow: `0 0 80px ${tier.glow}, 0 0 28px ${tier.glow}, 0 32px 72px rgba(0,0,0,0.85)`,
          position: 'relative',
          cursor: userId ? 'pointer' : 'default',
        }}>
          <div className="hero-card-shimmer" />

          {userId && (
            <Link
              href={`/jogador/${userId}`}
              style={{ position: 'absolute', inset: 0, zIndex: 20 }}
              aria-label={`Ver perfil de ${nome}`}
            />
          )}

          {/* Linha de topo */}
          <div style={{ height: '3px', background: `linear-gradient(90deg, transparent, ${tier.accent}, transparent)` }} />

          {/* OVR + badges */}
          <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{
                fontSize: '56px', fontWeight: 900, color: tier.ovr,
                lineHeight: 1, letterSpacing: '-0.04em',
                textShadow: `0 0 28px ${tier.glow}`,
              }}>{ovr}</div>
              <div style={{
                fontSize: '12px', fontWeight: 800,
                color: 'rgba(255,255,255,0.65)', letterSpacing: '0.12em', marginTop: '3px',
              }}>{posicao}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>
              <div style={{
                padding: '3px 8px', borderRadius: '6px', background: tier.badge,
                fontSize: '7px', fontWeight: 900, color: 'rgba(0,0,0,0.75)', letterSpacing: '0.12em',
              }}>{tier.label}</div>
              <div style={{
                width: '32px', height: '32px',
                background: 'rgba(255,255,255,0.07)', borderRadius: '8px',
                border: `1px solid ${tier.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '9px', fontWeight: 900, color: tier.ovr, letterSpacing: '0.04em',
              }}>MC</div>
              <span style={{ fontSize: '20px' }}>⚽</span>
            </div>
          </div>

          {/* Foto */}
          <div style={{
            height: '148px', margin: '8px 14px',
            borderRadius: '14px', overflow: 'hidden',
            position: 'relative', border: `1px solid ${tier.border}`,
            background: '#0a140d',
          }}>
            <AtletaFoto src={foto} alt={nome} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
              background: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.5) 50%,transparent 100%)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              boxShadow: `inset 0 0 22px ${tier.glow}`, borderRadius: '14px',
            }} />
          </div>

          {/* Nome */}
          <div style={{ padding: '0 16px 10px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ height: '1px', flex: 1, background: tier.border }} />
              <span style={{
                fontSize: '12px', fontWeight: 900, color: 'white',
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>{nome.split(' ').slice(0,2).join(' ')}</span>
              <div style={{ height: '1px', flex: 1, background: tier.border }} />
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '2px 8px', borderRadius: '20px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00FF88' }} />
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>
                avaliado por{' '}
                <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>
                  {treinadorNome.split(' ')[0]}
                </span>
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            padding: '10px 14px 16px',
            borderTop: `1px solid ${tier.border}`,
            background: 'rgba(0,0,0,0.35)',
          }}>
            {cardStats.map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 900, color: tier.ovr, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em', marginTop: '3px' }}>{k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ID do atleta */}
        <span style={{
          fontSize: '9px', fontWeight: 700,
          color: 'rgba(255,255,255,0.22)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
          ID {athlete_id}
        </span>
      </div>
    </>
  )
}
