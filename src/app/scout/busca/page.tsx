/**
 * /scout/busca — Busca de atletas para scouts
 * Server Component — filtros via searchParams
 */

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMap } from '@/lib/ovr'
import ScoutFiltros from './ScoutFiltros'

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcularIdade(dataNasc: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function calcularCategoria(dataNasc: string): string {
  const idade = calcularIdade(dataNasc)
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
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

// ── Page ─────────────────────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ posicao?: string; categoria?: string; cidade?: string }> }

export default async function ScoutBuscaPage({ searchParams }: Props) {
  const { posicao: posicaoFiltro, categoria: categoriaFiltro, cidade: cidadeFiltro } = await searchParams

  const admin = createAdminClient()

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const agora = new Date()
  const atletaUsers = users.filter(u => u.user_metadata?.tipo === 'atleta')

  const ids = atletaUsers.map(u => u.id)
  const [profilesRes, ovrMap] = await Promise.all([
    admin
      .from('profiles')
      .select('id, athlete_id, data_nascimento, bio, altura, peso, pe_dominante, clube_atual, avatar_url')
      .in('id', ids),
    fetchOvrMap(admin),
  ])

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]))

  const atletas = atletaUsers
    .map(u => {
      const meta = u.user_metadata as { nome?: string; posicao?: string; cidade?: string; promovido_ate?: string }
      const nome = meta.nome ?? 'Atleta'
      const p = profileMap.get(u.id)
      const dataNasc   = (p?.data_nascimento as string | null) ?? null
      const athleteId  = (p?.athlete_id as string | null) ?? null
      const ovr        = athleteId ? (ovrMap.get(athleteId) ?? null) : null
      const promovido  = meta.promovido_ate ? new Date(meta.promovido_ate) > agora : false
      return {
        id: u.id,
        nome,
        posicao:     meta.posicao ?? '',
        cidade:      meta.cidade  ?? '',
        ovr,
        promovido,
        pos:         posAbrev(meta.posicao ?? ''),
        categoria:   dataNasc ? calcularCategoria(dataNasc) : null,
        idade:       dataNasc ? calcularIdade(dataNasc) : null,
        bio:         (p?.bio as string | null) ?? null,
        altura:      (p?.altura as number | null) ?? null,
        peso:        (p?.peso as number | null) ?? null,
        peDominante: (p?.pe_dominante as string | null) ?? null,
        clubeAtual:  (p?.clube_atual as string | null) ?? null,
        avatarUrl:   (p?.avatar_url as string | null) ?? null,
        initials:    getInitials(nome),
      }
    })
    // Promovidos primeiro, depois por OVR
    .sort((a, b) => {
      if (a.promovido && !b.promovido) return -1
      if (!a.promovido && b.promovido) return 1
      return (b.ovr ?? 0) - (a.ovr ?? 0)
    })

  // Aplica filtros
  const filtered = atletas.filter(a => {
    if (posicaoFiltro && a.posicao !== posicaoFiltro) return false
    if (categoriaFiltro && a.categoria !== categoriaFiltro) return false
    if (cidadeFiltro && !a.cidade.toLowerCase().includes(cidadeFiltro.toLowerCase())) return false
    return true
  })

  const temFiltro = posicaoFiltro || categoriaFiltro || cidadeFiltro

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      <style>{`
        .scout-card { transition: border-color 0.18s, background 0.18s; }
        .scout-card:hover { border-color: rgba(34,197,94,0.3) !important; background: rgba(34,197,94,0.04) !important; }
        .pill-btn { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        select option { background: #0b1610; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(6,16,10,0.95)',
        backdropFilter: 'blur(16px)', zIndex: 50,
      }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.03em' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/scout/favoritos" style={{
            padding: '7px 14px', borderRadius: '8px',
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
            color: '#fbbf24', fontWeight: 700, fontSize: '12px', textDecoration: 'none',
          }}>
            ⭐ Favoritos
          </Link>
          <Link href="/scout/dashboard" style={{
            padding: '7px 14px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '12px', textDecoration: 'none',
          }}>
            Meu painel
          </Link>
          <Link href="/scout/entrar" style={{
            padding: '7px 14px', borderRadius: '8px', background: '#22c55e',
            color: 'black', fontWeight: 800, fontSize: '12px', textDecoration: 'none',
          }}>
            Entrar
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            🔍 Busca de talentos
          </p>
          <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Encontre o próximo craque
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {filtered.length} atleta{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            {temFiltro ? ' com os filtros aplicados' : ' na base'}
          </p>
        </div>

        {/* ── Filtros (client component — event handlers) ── */}
        <ScoutFiltros
          posicaoFiltro={posicaoFiltro}
          categoriaFiltro={categoriaFiltro}
          cidadeFiltro={cidadeFiltro}
        />

        {/* ── Resultados ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
            <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🔍</p>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Nenhum atleta encontrado</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Tente ajustar os filtros</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(atleta => (
              <Link
                key={atleta.id}
                href={`/jogador/${atleta.id}`}
                className="scout-card"
                style={{
                  display: 'block', textDecoration: 'none', color: 'white',
                  background: atleta.promovido
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.07), rgba(34,197,94,0.03))'
                    : '#0b1610',
                  border: atleta.promovido
                    ? '1px solid rgba(34,197,94,0.3)'
                    : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', padding: '18px 20px',
                  boxShadow: atleta.promovido ? '0 4px 20px rgba(34,197,94,0.1)' : 'none',
                  position: 'relative',
                }}
              >
                {atleta.promovido && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    fontSize: '10px', fontWeight: 800, color: '#22c55e',
                    background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '20px', padding: '2px 8px', letterSpacing: '0.06em',
                  }}>
                    ⚡ Em Destaque
                  </div>
                )}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                  {/* Avatar + OVR */}
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '50%',
                      background: 'linear-gradient(135deg,#15803d,#4ade80)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: 900,
                      boxShadow: '0 4px 14px rgba(34,197,94,0.25)',
                      marginBottom: '6px', overflow: 'hidden',
                    }}>
                      {atleta.avatarUrl
                        ? <img src={atleta.avatarUrl} alt={atleta.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : atleta.initials}
                    </div>
                    <div style={{
                      fontSize: '18px', fontWeight: 900,
                      color: atleta.ovr ? '#22c55e' : 'rgba(255,255,255,0.2)',
                      lineHeight: 1,
                    }}>
                      {atleta.ovr ?? '—'}
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      OVR
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {atleta.nome}
                      </h2>
                      {atleta.categoria && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, color: '#4ade80',
                          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                          borderRadius: '6px', padding: '2px 8px', whiteSpace: 'nowrap',
                        }}>
                          {atleta.categoria}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                      {atleta.pos}{atleta.posicao !== atleta.pos ? ` · ${atleta.posicao}` : ''}
                      {atleta.cidade ? ` · ${atleta.cidade}` : ''}
                      {atleta.idade  ? ` · ${atleta.idade} anos` : ''}
                    </p>

                    {/* Físico inline */}
                    {(atleta.altura || atleta.peso || atleta.peDominante) && (
                      <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                        {[
                          atleta.altura      ? `${atleta.altura}cm`              : null,
                          atleta.peso        ? `${atleta.peso}kg`                : null,
                          atleta.peDominante ? `Pé ${atleta.peDominante.toLowerCase()}` : null,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {atleta.clubeAtual && (
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                        ⚽ {atleta.clubeAtual}
                      </p>
                    )}

                    {/* Bio preview */}
                    {atleta.bio && (
                      <p style={{
                        margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.5, fontStyle: 'italic',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                      }}>
                        "{atleta.bio}"
                      </p>
                    )}
                  </div>

                  {/* Seta */}
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px', flexShrink: 0, alignSelf: 'center' }}>›</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── CTA para scouts sem conta ── */}
        <div style={{
          marginTop: '40px', padding: '24px', borderRadius: '20px',
          background: 'linear-gradient(135deg,#052e16,#0b1610)',
          border: '1px solid rgba(34,197,94,0.18)', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900 }}>
            Quer salvar buscas e contatar atletas?
          </p>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Crie sua conta de scout gratuitamente.
          </p>
          <Link href="/scout/cadastro" style={{
            display: 'inline-block', padding: '13px 28px', borderRadius: '14px',
            background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '15px', textDecoration: 'none',
          }}>
            Criar conta de scout →
          </Link>
        </div>
      </div>
    </main>
  )
}