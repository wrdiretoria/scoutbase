/**
 * /atleta/[sid] — Perfil público de atleta Meu Craque
 * Acessa pelo ID numérico (ex: MC-82751 → /atleta/82751)
 * Sem login necessário.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrSingle } from '@/lib/ovr'
import { SERVER_BASE_URL } from '@/lib/base-url'

type Props = { params: Promise<{ sid: string }> }

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function calcularIdade(dataNasc: string): number {
  const hoje = new Date(), nasc = new Date(dataNasc)
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

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AttrBar({ label, val }: { label: string; val: number }) {
  const pct   = Math.round((val / 10) * 100)
  const color = val >= 8 ? '#00FF88' : val >= 6 ? '#fbbf24' : '#f97316'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', width: '130px', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 800, color, width: '28px', textAlign: 'right' }}>
        {val.toFixed(1)}
      </span>
    </div>
  )
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sid } = await params
  const athleteId = `MC-${sid.toUpperCase()}`
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('athlete_id', athleteId)
      .maybeSingle()
    if (!profile) return { title: 'Atleta — Meu Craque' }
    const { data: { user } } = await admin.auth.admin.getUserById(profile.id)
    const nome = (user?.user_metadata?.nome as string | undefined) ?? 'Atleta'
    return {
      title: `${nome} — Meu Craque`,
      description: `Veja o perfil de ${nome} no Meu Craque: OVR, atributos e currículo.`,
      openGraph: { title: `${nome} — Meu Craque`, url: `${SERVER_BASE_URL}/atleta/${sid}` },
    }
  } catch { return { title: 'Atleta — Meu Craque' } }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AtletaPage({ params }: Props) {
  const { sid } = await params
  const athleteId = `MC-${sid.toUpperCase()}`
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, athlete_id, avatar_url, data_nascimento, bio, altura, peso, pe_dominante, clube_atual')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  // ── Atleta não encontrado — UI personalizada ───────────────────────────────
  if (!profile) {
    return (
      <main style={{
        background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>⚽</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900 }}>
            Atleta não encontrado
          </h1>
          <p style={{ margin: '0 0 32px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Nenhum atleta com ID{' '}
            <strong style={{ color: '#22c55e' }}>{athleteId}</strong>{' '}
            está cadastrado na plataforma.
          </p>
          <Link
            href="/ranking"
            style={{
              display: 'inline-block', padding: '12px 28px',
              borderRadius: '12px', background: '#22c55e',
              color: '#000', fontWeight: 800, fontSize: '14px', textDecoration: 'none',
            }}
          >
            ← Voltar ao ranking
          </Link>
        </div>
      </main>
    )
  }

  // ── Dados do atleta ───────────────────────────────────────────────────────
  const { data: { user } } = await admin.auth.admin.getUserById(profile.id as string)
  const meta     = user?.user_metadata as { nome?: string; posicao?: string; cidade?: string } | undefined
  const nome     = meta?.nome    ?? 'Atleta'
  const posicao  = meta?.posicao ?? ''
  const cidade   = meta?.cidade  ?? ''
  const dataNasc = (profile.data_nascimento as string | null) ?? null
  const avatarUrl = (profile.avatar_url as string | null) ?? null

  const [ovr, avRes] = await Promise.all([
    fetchOvrSingle(admin, athleteId),
    admin
      .from('avaliacoes')
      .select('velocidade, visao_jogo, forca, finalizacao, posicionamento, tecnica, scout_score, created_at')
      .eq('aluno_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const ultimaAv  = avRes.data
  const categoria = dataNasc ? calcularCategoria(dataNasc) : null
  const idade     = dataNasc ? calcularIdade(dataNasc) : null
  const initials  = getInitials(nome)
  const cor       = ovr ? ovrColor(ovr) : 'rgba(255,255,255,0.2)'

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px 56px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link href="/ranking" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            ← Ranking
          </Link>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e', letterSpacing: '0.12em' }}>
            ⚽ MEU CRAQUE
          </span>
        </div>

        {/* ── Card principal ── */}
        <div style={{
          borderRadius: '20px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.025)',
          marginBottom: '14px',
        }}>
          {/* Foto / Avatar */}
          <div style={{ position: 'relative', height: '220px', background: 'linear-gradient(135deg,#0d1f14,#1a4a2a)', overflow: 'hidden' }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl} alt={nome}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '60px', fontWeight: 900,
                color: '#22c55e', opacity: 0.35,
              }}>
                {initials}
              </div>
            )}

            {/* OVR badge */}
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
              borderRadius: '12px', padding: '8px 14px', textAlign: 'center',
              border: `1px solid ${cor}44`,
            }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>
                OVR
              </div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: cor, lineHeight: 1 }}>
                {ovr ?? '—'}
              </div>
            </div>

            {/* Categoria badge */}
            {categoria && (
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                fontSize: '10px', fontWeight: 700, color: '#4ade80',
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '8px', padding: '4px 10px',
                backdropFilter: 'blur(8px)',
              }}>
                {categoria}
              </div>
            )}
          </div>

          <div style={{ padding: '20px' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>
              {nome}
            </h1>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.42)' }}>
              {[posAbrev(posicao), posicao !== posAbrev(posicao) ? posicao : null, cidade, idade ? `${idade} anos` : null]
                .filter(Boolean).join(' · ')}
            </p>

            {/* Dados físicos */}
            {(profile.altura || profile.peso || profile.pe_dominante) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {profile.altura      && <Tag>{profile.altura as number}cm</Tag>}
                {profile.peso        && <Tag>{profile.peso as number}kg</Tag>}
                {profile.pe_dominante && <Tag>Pé {String(profile.pe_dominante).toLowerCase()}</Tag>}
              </div>
            )}

            {profile.clube_atual && (
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>
                ⚽ {String(profile.clube_atual)}
              </p>
            )}

            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', fontWeight: 700, letterSpacing: '0.1em' }}>
              {athleteId}
            </div>
          </div>
        </div>

        {/* ── Atributos técnicos ── */}
        {ultimaAv && (
          <div style={{
            borderRadius: '16px', padding: '20px',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: '14px',
          }}>
            <p style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Atributos técnicos
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AttrBar label="Velocidade"     val={ultimaAv.velocidade} />
              <AttrBar label="Visão de jogo"  val={ultimaAv.visao_jogo} />
              <AttrBar label="Força"           val={ultimaAv.forca} />
              <AttrBar label="Finalização"     val={ultimaAv.finalizacao} />
              <AttrBar label="Posicionamento"  val={ultimaAv.posicionamento} />
              <AttrBar label="Técnica"         val={ultimaAv.tecnica} />
            </div>
          </div>
        )}

        {/* ── Bio ── */}
        {profile.bio && (
          <div style={{
            borderRadius: '16px', padding: '18px 20px',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
            marginBottom: '14px',
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, fontStyle: 'italic' }}>
              &ldquo;{String(profile.bio)}&rdquo;
            </p>
          </div>
        )}

        {/* Rodapé */}
        <div style={{ textAlign: 'center', paddingTop: '8px' }}>
          <Link href="/ranking" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            ← Voltar ao ranking
          </Link>
        </div>

      </div>
    </main>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '12px', color: 'rgba(255,255,255,0.35)',
      background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '3px 9px',
    }}>
      {children}
    </span>
  )
}
