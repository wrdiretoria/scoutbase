/**
 * /ranking — Ranking público de todos os atletas auto-registrados
 * Server Component — busca dados via admin client (bypass RLS)
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { listAllUsers } from '@/lib/auth'
import { fetchOvrMap } from '@/lib/ovr'
import RankingFiltros from './RankingFiltros'

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcularCategoria(dataNasc: string): string {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 20) return `Sub-${idade}`
  return 'Adulto'
}

function getInitials(nome: string) {
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

const CATEGORIAS = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(n => `Sub-${n}`)

const RANK_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
  2: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.35)' },
  3: { bg: 'rgba(180,100,50,0.15)', text: '#cd7c3e', border: 'rgba(180,100,50,0.4)' },
}

// Gradiente do avatar por tier (ouro=amarelo, prata=cinza, bronze=laranja; resto=verde)
const AVATAR_TIER: Record<number, { bg: string; color: string }> = {
  1: { bg: 'linear-gradient(135deg,#3d2e05,#1a1400)', color: '#f59e0b' },
  2: { bg: 'linear-gradient(135deg,#1e2028,#0e0f18)', color: '#94a3b8' },
  3: { bg: 'linear-gradient(135deg,#2e1400,#140800)', color: '#cd7c3e' },
}

// ── Page ────────────────────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ categoria?: string; posicao?: string; cidade?: string; estado?: string; pais?: string; q?: string; ordem?: string }> }

export default async function RankingPage({ searchParams }: Props) {
  const { categoria: categoriaFiltro, posicao: posicaoFiltro, cidade: cidadeFiltro, estado: estadoFiltro, pais: paisFiltro, q: buscaFiltro, ordem: ordemFiltro } = await searchParams

  const admin = createAdminClient()

  // 1. Busca todos os usuários auth
  const users = await listAllUsers(admin).catch(() => null)
  if (!users) notFound()

  // 2. Filtra atletas
  const atletas = users.filter(u => u.user_metadata?.tipo === 'atleta')

  // 3. Busca perfis + OVR real em paralelo
  const ids = atletas.map(u => u.id)
  const [profilesRes, ovrMap] = await Promise.all([
    admin
      .from('profiles')
      .select('id, nome, athlete_id, data_nascimento, bio, altura, peso, clube_atual, avatar_url, criado_em')
      .in('id', ids),
    fetchOvrMap(admin),
  ])

  const profileMap = new Map(
    (profilesRes.data ?? []).map(p => [p.id, p])
  )

  // 4. Monta lista de atletas
  type RankingItem = {
    id: string; nome: string; posicao: string; cidade: string; estado: string; pais: string
    dataNasc: string | null; ovr: number | null; categoria: string | null
    initials: string; pos: string; avatarUrl: string | null; athleteId: string | null
    criadoEm: string | null
  }

  const profilesComCriacao = (profilesRes.data ?? []) as { id: string; nome: string | null; athlete_id: string | null; data_nascimento: string | null; avatar_url: string | null; criado_em?: string | null }[]

  const modoNovos      = ordemFiltro === 'novos'
  const modoVisitados  = ordemFiltro === 'visitados'

  // Para modo visitados: busca contagem de visitas por atleta
  let visitasMap = new Map<string, number>()
  if (modoVisitados) {
    const visitasRes = await admin.from('visitas').select('atleta_id')
    for (const row of visitasRes.data ?? []) {
      const id = (row as { atleta_id: string }).atleta_id
      visitasMap.set(id, (visitasMap.get(id) ?? 0) + 1)
    }
  }

  const ranking: RankingItem[] = atletas
    .map(u => {
      const meta = u.user_metadata as { nome?: string; posicao?: string; cidade?: string; estado?: string; pais?: string }
      const profile   = profileMap.get(u.id)
      const nome      = (profile?.nome as string | null) ?? meta.nome ?? 'Atleta'
      const dataNasc  = (profile?.data_nascimento as string | null) ?? null
      const athleteId = (profile?.athlete_id as string | null) ?? null
      const ovr       = athleteId ? (ovrMap.get(athleteId) ?? null) : null
      if (!modoNovos && !modoVisitados && ovr === null) return null   // ranking por OVR: só avaliados
      const criadoEm  = (profilesComCriacao.find(p => p.id === u.id) as { criado_em?: string | null } | undefined)?.criado_em ?? u.created_at ?? null
      return {
        id: u.id, nome,
        posicao:   meta.posicao ?? '',
        cidade:    meta.cidade  ?? '',
        estado:    meta.estado  ?? '',
        pais:      meta.pais    ?? 'Brasil',
        dataNasc,  ovr,
        categoria: dataNasc ? calcularCategoria(dataNasc) : null,
        initials:  getInitials(nome),
        pos:       posAbrev(meta.posicao ?? ''),
        avatarUrl: (profile?.avatar_url as string | null) ?? null,
        athleteId,
        criadoEm,
      }
    })
    .filter((a): a is RankingItem => a !== null)
    .sort((a, b) => {
      if (modoNovos)     return (b.criadoEm ?? '').localeCompare(a.criadoEm ?? '')
      if (modoVisitados) return (visitasMap.get(b.id) ?? 0) - (visitasMap.get(a.id) ?? 0)
      return (b.ovr ?? 0) - (a.ovr ?? 0)
    })

  // 5. Aplica filtros
  const buscaLower = buscaFiltro?.toLowerCase().trim() ?? ''
  const filtered = ranking.filter(a => {
    if (categoriaFiltro && a.categoria !== categoriaFiltro) return false
    if (posicaoFiltro   && a.posicao   !== posicaoFiltro)   return false
    if (paisFiltro      && a.pais.toLowerCase() !== paisFiltro.toLowerCase()) return false
    if (estadoFiltro    && a.estado.toUpperCase() !== estadoFiltro.toUpperCase()) return false
    if (cidadeFiltro    && !a.cidade.toLowerCase().includes(cidadeFiltro.toLowerCase())) return false
    if (buscaLower) {
      const matchNome    = a.nome.toLowerCase().includes(buscaLower)
      const matchPosicao = a.posicao.toLowerCase().includes(buscaLower)
      const matchCidade  = a.cidade.toLowerCase().includes(buscaLower)
      const matchId      = (a.athleteId ?? '').toLowerCase().includes(buscaLower)
      if (!matchNome && !matchPosicao && !matchCidade && !matchId) return false
    }
    return true
  })

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
    }}>
      <style>{`
        .rank-card { transition: background 0.2s, border-color 0.2s; }
        .rank-card:hover { background: rgba(34,197,94,0.06) !important; border-color: rgba(34,197,94,0.25) !important; }
        .filter-pill { transition: background 0.2s, color 0.2s; }
      `}</style>

      {/* Nav */}
      <nav style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: '#06100a', zIndex: 10,
      }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.01em' }}>
          ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
        </Link>
        <Link href="/atleta/cadastro" style={{
          padding: '8px 16px', borderRadius: '10px', background: '#22c55e',
          color: 'black', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
        }}>
          + Criar perfil
        </Link>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {modoVisitados ? '👁 Mais Visitados' : modoNovos ? '🆕 Recém chegados' : '🏆 Ranking Oficial'}
          </p>
          <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            {modoVisitados ? 'Mais visitados' : modoNovos ? 'Novos Craques' : 'Os melhores do futebol'}
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {filtered.length} atleta{filtered.length !== 1 ? 's' : ''}
            {buscaFiltro     ? ` · "${buscaFiltro}"`   : ''}
            {categoriaFiltro ? ` · ${categoriaFiltro}` : ''}
            {posicaoFiltro   ? ` · ${posicaoFiltro}`   : ''}
            {estadoFiltro    ? ` · ${estadoFiltro}`     : ''}
            {cidadeFiltro    ? ` · ${cidadeFiltro}`     : ''}
            {!buscaFiltro && !categoriaFiltro && !posicaoFiltro && !estadoFiltro && !cidadeFiltro ? ' · ranking geral' : ''}
          </p>
        </div>

        {/* Filtros de categoria (pills) */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {(() => {
            const extra = new URLSearchParams()
            if (posicaoFiltro) extra.set('posicao', posicaoFiltro)
            if (estadoFiltro)  extra.set('estado',  estadoFiltro)
            if (cidadeFiltro)  extra.set('cidade',  cidadeFiltro)
            const extraStr = extra.toString()
            return (
              <Link
                href={extraStr ? `/ranking?${extraStr}` : '/ranking'}
                className="filter-pill"
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  textDecoration: 'none', border: '1px solid',
                  background: !categoriaFiltro ? '#22c55e' : 'transparent',
                  color: !categoriaFiltro ? 'black' : 'rgba(255,255,255,0.45)',
                  borderColor: !categoriaFiltro ? '#22c55e' : 'rgba(255,255,255,0.12)',
                }}
              >
                Todos
              </Link>
            )
          })()}
          {CATEGORIAS.map(cat => {
            const q = new URLSearchParams({ categoria: cat })
            if (posicaoFiltro) q.set('posicao', posicaoFiltro)
            if (estadoFiltro)  q.set('estado',  estadoFiltro)
            if (cidadeFiltro)  q.set('cidade',  cidadeFiltro)
            return (
            <Link
              key={cat}
              href={`/ranking?${q.toString()}`}
              className="filter-pill"
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                textDecoration: 'none', border: '1px solid',
                background: categoriaFiltro === cat ? '#22c55e' : 'transparent',
                color: categoriaFiltro === cat ? 'black' : 'rgba(255,255,255,0.45)',
                borderColor: categoriaFiltro === cat ? '#22c55e' : 'rgba(255,255,255,0.12)',
              }}
            >
              {cat}
            </Link>
          )})}
        </div>

        {/* Filtros de posição + estado + cidade (client component) */}
        <RankingFiltros
          categoriaFiltro={categoriaFiltro}
          posicaoFiltro={posicaoFiltro}
          estadoFiltro={estadoFiltro}
          cidadeFiltro={cidadeFiltro}
          paisFiltro={paisFiltro}
        />

        {/* Lista de atletas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🏃</p>
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhum atleta nessa categoria ainda.</p>
            </div>
          )}

          {filtered.map((atleta, i) => {
            // Posição no ranking filtrado (começa em #1 dentro do filtro)
            const rankNum = i + 1
            const rc = RANK_COLORS[rankNum]
            const at = AVATAR_TIER[rankNum]
            const avatarBg    = at?.bg    ?? 'linear-gradient(135deg,#15803d,#4ade80)'
            const avatarColor = at?.color ?? 'rgba(255,255,255,0.85)'
            return (
              <Link
                key={atleta.id}
                href={`/jogador/${atleta.id}`}
                className="rank-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '14px 16px', borderRadius: '16px',
                  background: rc ? rc.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${rc ? rc.border : 'rgba(255,255,255,0.07)'}`,
                  textDecoration: 'none', color: 'white',
                }}
              >
                {/* Rank */}
                <div style={{
                  width: '32px', flexShrink: 0, textAlign: 'center',
                  fontSize: rankNum <= 3 ? '18px' : '15px',
                  fontWeight: 900,
                  color: rc ? rc.text : 'rgba(255,255,255,0.3)',
                }}>
                  {rankNum === 1 ? '🥇' : rankNum === 2 ? '🥈' : rankNum === 3 ? '🥉' : `#${rankNum}`}
                </div>

                {/* Avatar */}
                <div style={{
                  width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                  background: avatarBg,
                  position: 'relative',
                  boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                  overflow: 'hidden',
                }}>
                  {/* Iniciais: camada base */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 900, color: avatarColor,
                    userSelect: 'none',
                  }}>
                    {atleta.initials}
                  </div>
                  {/* Foto: camada superior */}
                  {atleta.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={atleta.avatarUrl}
                      alt={atleta.nome}
                      loading="lazy"
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '15px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {atleta.nome}
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                    {atleta.pos}{atleta.cidade ? ` · ${atleta.cidade}` : ''}{atleta.categoria ? ` · ${atleta.categoria}` : ''}
                  </p>
                </div>

                {/* Categoria */}
                {atleta.categoria && (
                  <span style={{
                    padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                    border: '1px solid rgba(34,197,94,0.25)', flexShrink: 0,
                  }}>
                    {atleta.categoria}
                  </span>
                )}

                {/* OVR */}
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  flexShrink: 0, minWidth: '40px',
                }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
                    {atleta.ovr}
                  </span>
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    OVR
                  </span>
                </div>

                {/* Seta */}
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '16px', flexShrink: 0 }}>›</div>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '40px', padding: '24px', borderRadius: '20px',
          background: 'linear-gradient(135deg,#052e16,#0b1610)',
          border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 900 }}>
            Você é o próximo.
          </p>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Crie seu perfil e entre no ranking.
          </p>
          <Link href="/atleta/cadastro" style={{
            display: 'inline-block', padding: '13px 32px', borderRadius: '14px',
            background: '#22c55e', color: 'black', fontWeight: 800,
            fontSize: '15px', textDecoration: 'none',
          }}>
            Criar meu perfil grátis →
          </Link>
        </div>
      </div>
    </main>
  )
}