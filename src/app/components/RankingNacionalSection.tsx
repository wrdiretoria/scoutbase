import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMapByUuid } from '@/lib/ovr'
import { formatNome } from '@/lib/formatNome'
import LoadMoreCardsRow from './LoadMoreCardsRow'
import type { MaisCard } from '@/app/api/landing/mais/route'

export const revalidate = 30

const LIMIT = 12

function calcCategoria(dataNasc: string | null): string | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

export default async function RankingNacionalSection() {
  const admin = createAdminClient()

  const [ovrByUuid, profilesRes, countRes] = await Promise.all([
    fetchOvrMapByUuid(admin),
    admin
      .from('profiles')
      .select('id, nome, posicao, athlete_id, avatar_url, fotos, criado_em, data_nascimento')
      .like('athlete_id', 'MC-%')
      .order('criado_em', { ascending: false })
      .limit(LIMIT),
    admin
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .like('athlete_id', 'MC-%'),
  ])

  const profiles = (profilesRes.data ?? []) as {
    id: string; nome: string | null; athlete_id: string | null
    avatar_url: string | null; fotos: (string | null)[] | null
    criado_em: string | null
  }[]

  if (profiles.length === 0) return null

  const hasMore = (countRes.count ?? 0) > LIMIT

  const profileIds = profiles.map(p => p.id)
  const avalRes = profileIds.length
    ? await admin.from('avaliacoes').select('aluno_id, velocidade, tecnica, finalizacao, forca, visao_jogo, posicionamento').in('aluno_id', profileIds).order('created_at', { ascending: false })
    : { data: [] }
  const atributosMap = new Map<string, { vel:number|null; tec:number|null; dri:number|null; fis:number|null; tat:number|null; pos:number|null }>()
  for (const row of (avalRes.data ?? []) as { aluno_id:string; velocidade:number|null; tecnica:number|null; finalizacao:number|null; forca:number|null; visao_jogo:number|null; posicionamento:number|null }[]) {
    if (!atributosMap.has(row.aluno_id)) atributosMap.set(row.aluno_id, { vel: row.velocidade??null, tec: row.tecnica??null, dri: row.finalizacao??null, fis: row.forca??null, tat: row.visao_jogo??null, pos: row.posicionamento??null })
  }

  const initial: MaisCard[] = profiles.map(p => {
    const fotos = (p.fotos ?? []).filter((f): f is string => !!f)
    return {
      id: p.id,
      nome: formatNome(p.nome ?? 'Atleta'),
      posicao: (p as Record<string,unknown>).posicao as string | null ?? null,
      athlete_id: p.athlete_id,
      foto: fotos[0] ?? p.avatar_url ?? null,
      ovr: ovrByUuid.get(p.id) ?? null,
      categoria: calcCategoria((p as Record<string,unknown>).data_nascimento as string | null ?? null),
      atributos: atributosMap.get(p.id) ?? null,
    }
  })

  return (
    <section style={{ background: '#080808', padding: '16px 0' }}>
      <style>{`.ranking-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.60)', textTransform: 'uppercase' }}>
              🆕 Recém chegados
            </p>
            <h2 style={{ margin: 0, fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              Novos <span style={{ color: '#00e676' }}>Craques</span>
            </h2>
          </div>
          <Link href="/ranking" style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(0,255,136,0.70)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Ver todos →
          </Link>
        </div>

        <LoadMoreCardsRow
          tipo="novos"
          initialItems={initial}
          initialOffset={LIMIT}
          limit={LIMIT}
          hasMoreInit={hasMore}
        />

      </div>
    </section>
  )
}
