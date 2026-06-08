import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import AtletaCardLanding from './AtletaCardLanding'
import { formatNome } from '@/lib/formatNome'

export const revalidate = 120

type AvalRow = {
  aluno_id: string
  velocidade: number | null
  tecnica: number | null
  finalizacao: number | null
  forca: number | null
  visao_jogo: number | null
  posicionamento: number | null
}

function toAttr(n: unknown) {
  return Math.min(99, Math.max(0, Math.round(typeof n === 'number' ? n : 0)))
}

export default async function MaisVisitadosSection() {
  const admin = createAdminClient()

  // Conta visitas por atleta_id — usa tabela real `visitas`
  const { data: visitasData, error } = await admin
    .from('visitas')
    .select('atleta_id')

  if (error || !visitasData || visitasData.length === 0) {
    return null
  }

  // Agrupa contagens
  const countMap = new Map<string, number>()
  for (const row of visitasData as { atleta_id: string }[]) {
    if (!row.atleta_id) continue
    countMap.set(row.atleta_id, (countMap.get(row.atleta_id) ?? 0) + 1)
  }

  if (countMap.size === 0) return null

  // Top 8 por visitas
  const topIds = [...countMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id)

  const [profilesRes, ovrByUuid] = await Promise.all([
    admin.from('profiles').select('id, nome, posicao, athlete_id, avatar_url, fotos').in('id', topIds),
    fetchOvrMapByUuid(admin),
  ])

  const profiles = (profilesRes.data ?? []) as {
    id: string; nome: string | null; posicao: string | null; athlete_id: string | null
    avatar_url: string | null; fotos: (string | null)[] | null
  }[]

  const items = topIds
    .map(id => profiles.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)

  if (items.length === 0) return null

  // Busca avaliações mais recentes em batch
  const { data: avRows } = await admin
    .from('avaliacoes')
    .select('aluno_id, velocidade, tecnica, finalizacao, forca, visao_jogo, posicionamento, created_at')
    .in('aluno_id', topIds)
    .order('created_at', { ascending: false })

  const avsMap = new Map<string, AvalRow>()
  for (const row of (avRows ?? []) as unknown as (AvalRow & { created_at: string })[]) {
    if (!avsMap.has(row.aluno_id)) avsMap.set(row.aluno_id, row)
  }

  return (
    <section style={{ background: '#080808', padding: '16px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.60)', textTransform: 'uppercase' }}>
            🔥 Mais procurados
          </p>
          <h2 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            Mais <span style={{ color: '#00e676' }}>Visitados</span>
          </h2>
        </div>

        {/* Scroll horizontal */}
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' }}>
          <style>{`.mais-visitados-scroll::-webkit-scrollbar { display: none; }`}</style>
          <div className="mais-visitados-scroll landing-cards" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
            {items.map(p => {
              const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
              const foto = fotos[0] ?? p.avatar_url ?? null
              const ovr = ovrByUuid.get(p.id) ?? null
              const av = avsMap.get(p.id)
              const atributos = av ? {
                vel: toAttr(av.velocidade),
                tec: toAttr(av.tecnica),
                dri: toAttr(av.finalizacao),
                fis: toAttr(av.forca),
                tat: toAttr(av.visao_jogo),
                pos: toAttr(av.posicionamento),
              } : null
              return (
                <div key={p.id} style={{ flexShrink: 0, width: '180px' }}>
                  <AtletaCardLanding
                    nome={formatNome(p.nome ?? 'Atleta')}
                    ovr={ovr}
                    foto={foto}
                    posicao={p.posicao ?? null}
                    categoria={null}
                    atributos={atributos}
                    href={`/jogador/${p.id}`}
                    athleteId={p.athlete_id}
                    width="180px"
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link href="/ranking" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 32px', borderRadius: '100px',
            border: '1.5px solid rgba(0,230,118,0.40)',
            color: '#00e676', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', letterSpacing: '0.08em',
          }}>
            Carregar Mais
          </Link>
        </div>

      </div>
    </section>
  )
}
