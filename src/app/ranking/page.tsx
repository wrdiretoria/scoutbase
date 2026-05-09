/**
 * /ranking — Ranking público de todos os atletas auto-registrados
 * Server Component — busca dados via admin client (bypass RLS)
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'

// ── Helpers ─────────────────────────────────────────────────────────────────

function calcularCategoria(dataNasc: string): string {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

function calcularOVR(nome: string): number {
  const hash = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 68 + (hash % 13)
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

const CATEGORIAS = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto']

const RANK_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.4)' },
  2: { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.35)' },
  3: { bg: 'rgba(180,100,50,0.15)', text: '#cd7c3e', border: 'rgba(180,100,50,0.4)' },
}

// ── Page ────────────────────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ categoria?: string }> }

export default async function RankingPage({ searchParams }: Props) {
  const { categoria: categoriaFiltro } = await searchParams

  const admin = createAdminClient()

  // 1. Busca todos os usuários auth
  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) notFound()

  // 2. Filtra atletas
  const atletas = users.filter(u => u.user_metadata?.tipo === 'atleta')

  // 3. Busca perfis com data_nascimento
  const ids = atletas.map(u => u.id)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, data_nascimento')
    .in('id', ids)

  const profileMap = new Map(
    (profiles ?? []).map(p => [p.id, p.data_nascimento as string | null])
  )

  // 4. Monta e ordena ranking
  const ranking = atletas
    .map(u => {
      const meta = u.user_metadata as { nome?: string; posicao?: string; cidade?: string }
      const nome = meta.nome ?? 'Atleta'
      const dataNasc = profileMap.get(u.id) ?? null
      return {
        id: u.id,
        nome,
        posicao: meta.posicao ?? '',
        cidade: meta.cidade ?? '',
        dataNasc,
        ovr: calcularOVR(nome),
        categoria: dataNasc ? calcularCategoria(dataNasc) : null,
        initials: getInitials(nome),
        pos: posAbrev(meta.posicao ?? ''),
      }
    })
    .sort((a, b) => b.ovr - a.ovr)

  // 5. Aplica filtro de categoria
  const filtered = categoriaFiltro
    ? ranking.filter(a => a.categoria === categoriaFiltro)
    : ranking

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
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.03em' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </Link>
        <Link href="/cadastro" style={{
          padding: '8px 16px', borderRadius: '10px', background: '#22c55e',
          color: 'black', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
        }}>
          + Criar perfil
        </Link>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            🏆 Ranking Oficial
          </p>
          <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Os melhores do Brasil
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {filtered.length} atleta{filtered.length !== 1 ? 's' : ''}{categoriaFiltro ? ` · ${categoriaFiltro}` : ' · todos'}
          </p>
        </div>

        {/* Filtros de categoria */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <Link
            href="/ranking"
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
          {CATEGORIAS.map(cat => (
            <Link
              key={cat}
              href={`/ranking?categoria=${cat}`}
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
          ))}
        </div>

        {/* Lista de atletas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
              <p style={{ fontSize: '32px', margin: '0 0 8px' }}>🏃</p>
              <p style={{ margin: 0, fontSize: '14px' }}>Nenhum atleta nessa categoria ainda.</p>
            </div>
          )}

          {filtered.map((atleta, i) => {
            const rankNum = ranking.indexOf(atleta) + 1 // posição no ranking geral
            const rc = RANK_COLORS[rankNum]
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
                  background: 'linear-gradient(135deg,#15803d,#4ade80)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                }}>
                  {atleta.initials}
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

                {/* OVR */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ margin: '0 0 1px', fontSize: '24px', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
                    {atleta.ovr}
                  </p>
                  <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    OVR
                  </p>
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
          <Link href="/cadastro" style={{
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
