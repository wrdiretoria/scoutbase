/**
 * /jogador/[id] — Currículo público do atleta
 * Acessível sem login. Compartilhável no story / WhatsApp / grupos.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { fetchOvrSingle } from '@/lib/ovr'
import {
  VARIANTES, BLOCO_PERFIL as Q_BPERF,
  type VarianteKey, type QuestionDef,
} from '@/lib/questionnaire'
import VisitTracker from './VisitTracker'
import CopiarLink from './CopiarLink'
import FavoritoButton from './FavoritoButton'
import FotoSlideshow from './FotoSlideshow'
import CardShare from './CardShare'
import { SERVER_BASE_URL } from '@/lib/base-url'

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!isUuid(id)) return { title: 'Atleta — Meu Craque' }
  try {
  const admin = createAdminClient()
  const { data: { user } } = await admin.auth.admin.getUserById(id)
  const meta = user?.user_metadata as { nome?: string; posicao?: string; cidade?: string; tipo?: string } | undefined

  if (!user || meta?.tipo !== 'atleta') {
    return { title: 'Atleta — Meu Craque' }
  }

  const nome    = meta.nome    ?? 'Atleta'
  const posicao = meta.posicao ? ` · ${meta.posicao}` : ''
  const cidade  = meta.cidade  ? ` · ${meta.cidade}` : ''
  const title   = `${nome}${posicao}${cidade} — Meu Craque`
  const description = `Confira o perfil completo de ${nome} no Meu Craque: OVR, avaliações de treinadores, físico e currículo completo.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SERVER_BASE_URL}/jogador/${id}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/jogador/${id}`,
    },
  }
  } catch {
    return { title: 'Atleta — Meu Craque' }
  }
}

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


function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function getHlThumbnail(plataforma: string, videoId: string, thumbUrl: string | null): string | null {
  if (thumbUrl) return thumbUrl
  if (plataforma === 'youtube') return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
  return null
}

function getPlataformaLabel(p: string): string {
  return { youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', vimeo: 'Vimeo' }[p] ?? p
}

function getPlataformaCor(p: string): string {
  return { youtube: '#FF0000', tiktok: '#010101', instagram: '#E1306C', vimeo: '#1AB7EA' }[p] ?? '#555'
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

// ── Avaliação detalhada pública (novo formato 20 atributos) ───────────────────

function notaBarColor(pct: number): string {
  if (pct >= 80) return '#00FF88'
  if (pct >= 60) return '#22c55e'
  if (pct >= 40) return '#eab308'
  if (pct >= 20) return '#f59e0b'
  return '#ef4444'
}

function BarSimples({ icon, label, value }: { icon: string; label: string; value: number }) {
  const pct = value  // já em 0-100
  const cor = notaBarColor(pct)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', lineHeight: 1 }}>{icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>{label}</span>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 900, color: cor, fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(pct / 20)}/5
        </span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '3px', background: `linear-gradient(90deg,${cor}80,${cor})`, width: `${pct}%`, boxShadow: `0 0 6px ${cor}40` }} />
      </div>
    </div>
  )
}

function AvaliacaoPublicaDetalhada({ respostas }: { respostas: Record<string, number> & { variante?: string } }) {
  const variante = (respostas.variante ?? 'iniciacao') as VarianteKey
  const blocoA   = VARIANTES[variante].blocoA
  const blocoC   = VARIANTES[variante].blocoC
  const etiqueta = VARIANTES[variante].label

  // converte nota 1-5 para barra 0-100
  const toBar = (v: number) => v > 0 ? Math.round(((v - 1) / 4) * 100) : 0

  const allQs  = [...blocoA, ...Q_BPERF, ...blocoC]
  const fortes = allQs.filter(q => (respostas[q.key] ?? 0) >= 4).sort((a, b) => (respostas[b.key] ?? 0) - (respostas[a.key] ?? 0)).slice(0, 3)
  const melhor = allQs.filter(q => { const v = respostas[q.key] ?? 0; return v > 0 && v <= 2 }).sort((a, b) => (respostas[a.key] ?? 0) - (respostas[b.key] ?? 0)).slice(0, 3)

  const tagColors: Record<number, string> = { 1:'#ef4444', 2:'#f59e0b', 3:'#eab308', 4:'#22c55e', 5:'#00FF88' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
        {etiqueta}
      </p>

      {/* Técnico */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>⚽ Técnico</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {blocoA.map((q: QuestionDef) => (
            <BarSimples key={q.key} icon={q.icon} label={q.label} value={toBar(respostas[q.key] ?? 0)} />
          ))}
        </div>
      </div>

      {/* Perfil chips */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>🎭 Perfil</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {Q_BPERF.map((q: QuestionDef) => {
            const v   = respostas[q.key] ?? 0
            const cor = tagColors[v] ?? 'rgba(255,255,255,0.2)'
            return (
              <div key={q.key} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700,
                background: v >= 4 ? `${cor}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${v >= 4 ? `${cor}40` : 'rgba(255,255,255,0.07)'}`,
                color: v >= 4 ? cor : 'rgba(255,255,255,0.35)',
              }}>
                {q.icon} {q.label} <span style={{ opacity: 0.6, fontSize: '10px' }}>{v}/5</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contextual */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>💪 Contextual</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {blocoC.map((q: QuestionDef) => (
            <BarSimples key={q.key} icon={q.icon} label={q.label} value={toBar(respostas[q.key] ?? 0)} />
          ))}
        </div>
      </div>

      {/* Pontos fortes */}
      {fortes.length > 0 && (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}>
          <p style={{ margin: '0 0 7px', fontSize: '9px', fontWeight: 700, color: 'rgba(34,197,94,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>✦ Pontos fortes</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {fortes.map((q: QuestionDef) => (
              <span key={q.key} style={{ padding: '3px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
                {q.icon} {q.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* A melhorar */}
      {melhor.length > 0 && (
        <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.10)' }}>
          <p style={{ margin: '0 0 7px', fontSize: '9px', fontWeight: 700, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>▲ A melhorar</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {melhor.map((q: QuestionDef) => (
              <span key={q.key} style={{ padding: '3px 9px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>
                {q.icon} {q.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function JogadorPublicoPage({ params }: Props) {
  const { id } = await params

  if (!isUuid(id)) notFound()

  const admin = createAdminClient()

  let user: Awaited<ReturnType<typeof admin.auth.admin.getUserById>>['data']['user']
  try {
    const res = await admin.auth.admin.getUserById(id)
    if (res.error || !res.data.user) notFound()
    user = res.data.user
  } catch {
    notFound()
  }

  // Verifica se o visitante é o dono do perfil
  let isOwner = false
  try {
    const supabase = await createServerClient()
    const { data: { user: visitor } } = await supabase.auth.getUser()
    isOwner = visitor?.id === id
  } catch { /* visitante anônimo — isOwner fica false */ }

  const meta = user.user_metadata as {
    nome?: string; posicao?: string; cidade?: string; tipo?: string
    visit_count?: number; favorito_count?: number
    telefone?: string
    clubes_anteriores?: string
    campeonatos?: string
    titulos?: string
    premiacoes?: string
  }

  if (meta?.tipo !== 'atleta') notFound()

  const nome    = meta.nome    ?? 'Atleta'
  const posicao = meta.posicao ?? ''
  const cidade  = meta.cidade  ?? ''

  // Campos extras (user_metadata)
  const telefone         = meta.telefone          ?? null
  const clubesAnteriores = meta.clubes_anteriores ?? null
  const campeonatosTexto = meta.campeonatos        ?? null
  const titulosTexto     = meta.titulos            ?? null
  const premiacoesTexto  = meta.premiacoes         ?? null

  const { data: profile } = await admin
    .from('profiles')
    .select('athlete_id, data_nascimento, bio, altura, peso, pe_dominante, clube_atual, avatar_url, fotos')
    .eq('id', id)
    .single()

  const athleteId   = (profile?.athlete_id   as string | null) ?? null
  const dataNasc    = (profile?.data_nascimento as string | null) ?? null
  const bio         = (profile?.bio          as string | null) ?? null
  const altura      = (profile?.altura       as number | null) ?? null
  const peso        = (profile?.peso         as number | null) ?? null
  const peDominante = (profile?.pe_dominante as string | null) ?? null
  const clubeAtual  = (profile?.clube_atual  as string | null) ?? null
  const avatarUrl   = (profile?.avatar_url  as string | null) ?? null
  const fotosArray: string[] = (() => {
    const raw = profile?.fotos
    if (!Array.isArray(raw)) return avatarUrl ? [avatarUrl] : []
    const filtered = (raw as (string | null)[]).filter((f): f is string => !!f)
    return filtered.length > 0 ? filtered : (avatarUrl ? [avatarUrl] : [])
  })()
  const hasPhoto = fotosArray.length > 0
  // +1 porque esta visita ainda não foi contabilizada (acontece client-side após render)
  const visitCount     = (meta.visit_count     ?? 0) + 1
  const favoritoCount  = meta.favorito_count   ?? 0

  // Busca OVR + última avaliação (atributos detalhados para scouts)
  type AvaliacaoDetalhada = {
    velocidade: number; visao_jogo: number; forca: number
    finalizacao: number; posicionamento: number; tecnica: number
    scout_score: number; observacao: string | null; professor_id: string
    created_at: string
    respostas?: (Record<string, number> & { variante?: string }) | null
  }

  type HighlightPublico = {
    id: string; url: string; plataforma: string
    video_id: string; titulo: string | null; thumbnail_url: string | null
  }

  const [categoria, ovr, ultimaAv, highlights] = await Promise.all([
    Promise.resolve(dataNasc ? calcularCategoria(dataNasc) : null),
    athleteId ? fetchOvrSingle(admin, athleteId) : Promise.resolve(null),
    // Última avaliação com atributos detalhados (via auth UUID direto)
    (async () => {
      try {
        const r = await admin.from('avaliacoes')
          .select('velocidade, visao_jogo, forca, finalizacao, posicionamento, tecnica, scout_score, observacao, professor_id, created_at')
          .eq('aluno_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        return r.data as AvaliacaoDetalhada | null
      } catch { return null }
    })(),
    // Highlights (vídeos do atleta em campo)
    (async () => {
      try {
        const r = await admin.from('highlights')
          .select('id, url, plataforma, video_id, titulo, thumbnail_url')
          .eq('profile_id', id)
          .order('created_at', { ascending: false })
        return (r.data ?? []) as HighlightPublico[]
      } catch { return [] as HighlightPublico[] }
    })(),
  ])

  // Nome do treinador que fez a avaliação
  let treinadorNome: string | null = null
  if (ultimaAv?.professor_id) {
    try {
      const { data: tProf } = await admin.from('profiles').select('nome').eq('id', ultimaAv.professor_id).single()
      treinadorNome = (tProf?.nome as string | null) ?? null
    } catch { /* silencia */ }
  }
  const initials  = getInitials(nome)
  const pos       = posAbrev(posicao)

  const temFisico    = altura || peso || peDominante
  const temCurriculo = bio || temFisico || clubeAtual || clubesAnteriores || campeonatosTexto || titulosTexto || premiacoesTexto

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px 20px 60px',
    }}>
      <style>{`
        @keyframes cardIn {
          from { opacity:0; transform:translateY(24px) scale(0.97) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        @keyframes ovrIn {
          0%  { opacity:0; transform:scale(0.6) }
          65% { transform:scale(1.06) }
          100%{ opacity:1; transform:scale(1) }
        }
        @keyframes glowPulse {
          0%,100% { text-shadow:0 0 24px rgba(34,197,94,0.5),0 0 48px rgba(34,197,94,0.22) }
          50%     { text-shadow:0 0 40px rgba(34,197,94,0.78),0 0 80px rgba(34,197,94,0.38) }
        }
        @keyframes ctaShimmer {
          0%   { left:-70% }
          100% { left:140% }
        }
        @keyframes photoFadeIn {
          from { opacity:0 }
          to   { opacity:1 }
        }
        .pub-card { animation: cardIn .5s cubic-bezier(.22,.68,0,1.2) forwards; }
        .pub-ovr  { animation: ovrIn .5s cubic-bezier(.22,.68,0,1.2) forwards .3s, glowPulse 3s ease-in-out infinite 1s; opacity:0; }
        .curr-section { animation: cardIn .5s ease forwards; }
        .scout-cta-btn {
          display:flex; align-items:center; justify-content:center; gap:8px;
          padding:14px 16px; border-radius:14px;
          background:linear-gradient(160deg,#166534 0%,#22c55e 100%);
          color:white; font-weight:800; font-size:14px;
          text-decoration:none; text-align:center;
          box-shadow:0 4px 22px rgba(34,197,94,0.32), 0 1px 0 rgba(255,255,255,0.08) inset;
          letter-spacing:0.01em; position:relative; overflow:hidden;
          transition:filter .18s ease, transform .15s ease;
        }
        .scout-cta-btn:hover {
          filter:brightness(1.08);
          transform:translateY(-1px);
        }
        .scout-cta-btn:active { transform:scale(0.97); filter:brightness(0.95); }
        .scout-cta-btn::after {
          content:'';
          position:absolute; top:0; bottom:0; width:40%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
          transform:skewX(-16deg);
          animation:ctaShimmer 3.5s ease-in-out infinite 1.5s;
        }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* Rastreia visita silenciosamente (client) */}
      <VisitTracker athleteUserId={id} />

      <div style={{ maxWidth: '380px', margin: '0 auto' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link
            href="/ranking"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none', padding: '6px 12px',
              borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              transition: 'color .15s',
            }}
          >
            ← Ranking
          </Link>
          <Link href="/" style={{ fontSize: '16px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.04em' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </Link>
          {/* Direita: views + scouts + favorito */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 700,
              color: 'rgba(255,255,255,0.28)',
              padding: '6px 10px', borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
            }}>
              <span style={{ fontSize: '12px' }}>👁</span>
              {visitCount.toLocaleString('pt-BR')}
            </div>
            {favoritoCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                fontSize: '11px', fontWeight: 700,
                color: '#fbbf24',
                padding: '6px 10px', borderRadius: '8px',
                border: '1px solid rgba(251,191,36,0.2)',
                background: 'rgba(251,191,36,0.07)',
              }}>
                <span style={{ fontSize: '12px' }}>⭐</span>
                {favoritoCount}
              </div>
            )}
            <FavoritoButton atletaId={id} />
          </div>
        </div>

        {/* ── Card principal ── */}
        <div className="pub-card" style={{
          borderRadius: '22px', overflow: 'hidden',
          background: '#0b1610',
          border: '1px solid rgba(34,197,94,0.22)',
          boxShadow: '0 0 56px rgba(34,197,94,0.15), 0 24px 64px rgba(0,0,0,0.6)',
          marginBottom: '16px',
        }}>

          {/* ── Topo: foto full-cover OU gradiente ── */}
          <div style={{
            position: 'relative',
            height: hasPhoto ? '240px' : '148px',
            overflow: 'hidden',
            background: hasPhoto
              ? '#0a120e'
              : 'linear-gradient(160deg,#166534 0%,#052e16 100%)',
          }}>
            {/* Slideshow de fotos ciclando de 2 em 2 segundos */}
            {hasPhoto && <FotoSlideshow fotos={fotosArray} nome={nome} />}

            {/* Grid sutil — só sem foto */}
            {!hasPhoto && (
              <div style={{
                position: 'absolute', inset: 0, opacity: 1,
                backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 28px)',
              }} />
            )}

            {/* Gradiente de leitura sobre foto */}
            {hasPhoto && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.60) 75%, rgba(0,0,0,0.85) 100%)',
              }} />
            )}

            {/* Badges OVR + Categoria — topo do painel */}
            <div style={{
              position: 'absolute', top: 14, left: 14, right: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              zIndex: 4,
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(34,197,94,0.35)',
                borderRadius: '10px', padding: '6px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}>
                <span style={{ fontSize: '8px', fontWeight: 800, color: 'rgba(0,255,136,0.75)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>OVR</span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1, letterSpacing: '-0.03em' }}>{ovr ?? '—'}</span>
              </div>
              {categoria ? (
                <div style={{
                  background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(34,197,94,0.35)',
                  borderRadius: '8px', padding: '4px 10px',
                  fontSize: '10px', fontWeight: 800, color: '#4ade80', letterSpacing: '0.06em',
                }}>{categoria}</div>
              ) : <div />}
            </div>

            {/* Nome + posição sobre foto (rodapé do painel) */}
            {hasPhoto && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '0 16px 14px', zIndex: 4,
              }}>
                <h1 style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: 900, color: 'white', letterSpacing: '-0.01em', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                  {nome}
                </h1>
                <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.70)', fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                  {pos}{posicao !== pos ? ` · ${posicao}` : ''}{cidade ? ` · ${cidade}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Avatar circular — só sem foto */}
          {!hasPhoto && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-34px', position: 'relative', zIndex: 2 }}>
              <div style={{
                width: '68px', height: '68px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#15803d,#4ade80)',
                border: '3px solid #0b1610',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 900, color: 'white',
                boxShadow: '0 8px 28px rgba(34,197,94,0.45)',
              }}>
                {initials}
              </div>
            </div>
          )}

          {/* Dados */}
          <div style={{ padding: hasPhoto ? '14px 20px 22px' : '12px 20px 22px', textAlign: 'center' }}>
            {/* Nome + posição — só sem foto (com foto ficam sobre a imagem) */}
            {!hasPhoto && (
              <>
                <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'white' }}>{nome}</h1>
                <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                  {posicao}{cidade ? ` · ${cidade}` : ''}
                </p>
              </>
            )}
            {/* ID — sempre visível, para todo atleta */}
            {athleteId && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 800, color: 'rgba(34,197,94,0.85)',
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)',
                  borderRadius: '6px', padding: '3px 10px', letterSpacing: '0.1em',
                }}>
                  🪪 ID {athleteId.replace(/^[A-Z]+-/, '')}
                </span>
              </div>
            )}
            {clubeAtual && (
              <p style={{ margin: avatarUrl ? '0 0 14px' : '0 0 14px', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                ⚽ {clubeAtual}
              </p>
            )}
            {!clubeAtual && <div style={{ marginBottom: hasPhoto ? '6px' : '14px' }} />}

            {/* Dados físicos inline */}
            {temFisico && (
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '16px',
                marginBottom: '16px', padding: '12px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {altura && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'white' }}>{altura}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>cm</p>
                  </div>
                )}
                {altura && (peso || peDominante) && (
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
                )}
                {peso && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'white' }}>{peso}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>kg</p>
                  </div>
                )}
                {peso && peDominante && (
                  <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)', alignSelf: 'stretch' }} />
                )}
                {peDominante && (
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'white' }}>
                      {peDominante === 'Direito' ? '🦶R' : peDominante === 'Esquerdo' ? '🦶L' : '⚖️'}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{peDominante}</p>
                  </div>
                )}
              </div>
            )}

            {/* CTA — scout acessa currículo completo */}
            <a href="#curriculo" className="scout-cta-btn">
              <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Acessar currículo completo
              <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.65)" strokeWidth="2.5" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </a>
          </div>
        </div>

        {/* ── Avaliação + Currículo — âncora para o CTA ── */}
        {ultimaAv && (
          <div id="curriculo" className="curr-section" style={{
            background: '#0b1610', border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: '18px', padding: '20px', marginBottom: '16px',
            scrollMarginTop: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Avaliação oficial
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  {treinadorNome ?? 'Treinador'} · {new Date(ultimaAv.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#22c55e', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 16px rgba(34,197,94,0.5)' }}>
                  {ultimaAv.scout_score}
                </div>
                <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>OVR</div>
              </div>
            </div>
            {/* Atributos */}
            {ultimaAv.respostas
              ? <AvaliacaoPublicaDetalhada respostas={ultimaAv.respostas} />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Velocidade',     val: ultimaAv.velocidade    },
                    { label: 'Técnica',        val: ultimaAv.tecnica       },
                    { label: 'Visão de Jogo',  val: ultimaAv.visao_jogo   },
                    { label: 'Finalização',    val: ultimaAv.finalizacao   },
                    { label: 'Força',          val: ultimaAv.forca         },
                    { label: 'Posicionamento', val: ultimaAv.posicionamento },
                  ].map(attr => {
                    const pct = (attr.val / 10) * 100
                    const cor = attr.val >= 8 ? '#22c55e' : attr.val >= 6 ? '#f59e0b' : '#94a3b8'
                    return (
                      <div key={attr.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.04em' }}>
                            {attr.label}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: cor, fontVariantNumeric: 'tabular-nums' }}>
                            {attr.val}
                          </span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '3px', background: `linear-gradient(90deg, ${cor}80, ${cor})`, width: `${pct}%`, boxShadow: `0 0 6px ${cor}40` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }
            {/* Observação do treinador */}
            {ultimaAv.observacao && (
              <div style={{
                marginTop: '14px', padding: '12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ margin: '0 0 4px', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Observação do treinador
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontStyle: 'italic' }}>
                  &ldquo;{ultimaAv.observacao}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Currículo completo ── */}
        {temCurriculo && (
          <div id={!ultimaAv ? 'curriculo' : undefined} className="curr-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px', scrollMarginTop: '20px' }}>

            {/* Apresentação */}
            {bio && (
              <div style={{
                background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '18px',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Apresentação
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  {bio}
                </p>
              </div>
            )}

            {/* Categoria + status */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              gap: '10px',
            }}>
              <div style={{
                background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '14px', textAlign: 'center',
              }}>
                <p style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 900, color: '#22c55e' }}>
                  {categoria ?? '—'}
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Categoria</p>
              </div>
              <div style={{
                background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', padding: '14px', textAlign: 'center',
              }}>
                <p style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 900, color: ovr ? '#22c55e' : 'rgba(255,255,255,0.18)' }}>
                  {ovr ?? '—'}
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall</p>
              </div>
            </div>

            {/* Clubes anteriores */}
            {clubesAnteriores && (
              <div style={{
                background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '18px',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  🏟 Clubes que já joguei
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  {clubesAnteriores}
                </p>
              </div>
            )}

            {/* Campeonatos */}
            {campeonatosTexto && (
              <div style={{
                background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '18px',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  🏆 Campeonatos disputados
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  {campeonatosTexto}
                </p>
              </div>
            )}

            {/* Títulos */}
            {titulosTexto && (
              <div style={{
                background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '18px',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  🥇 Títulos conquistados
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  {titulosTexto}
                </p>
              </div>
            )}

            {/* Premiações individuais */}
            {premiacoesTexto && (
              <div style={{
                background: '#0b1610', border: '1px solid rgba(251,191,36,0.18)',
                borderRadius: '16px', padding: '18px',
              }}>
                <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  🏅 Premiações individuais
                </p>
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                  {premiacoesTexto}
                </p>
              </div>
            )}

          </div>
        )}

        {/* ── Highlights — vídeos em campo ── */}
        {highlights.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              🎬 Highlights
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {highlights.map(hl => {
                const thumb = getHlThumbnail(hl.plataforma, hl.video_id, hl.thumbnail_url)
                const corPlat = getPlataformaCor(hl.plataforma)
                const labelPlat = getPlataformaLabel(hl.plataforma)
                return (
                  <a
                    key={hl.id}
                    href={hl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'block', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0b1610' }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a120e', overflow: 'hidden' }}>
                      {thumb ? (
                        <img src={thumb} alt={hl.titulo ?? labelPlat} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: `linear-gradient(135deg,${corPlat}22,rgba(0,0,0,0.7))`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '32px', opacity: 0.6 }}>▶</span>
                        </div>
                      )}
                      {/* Overlay play */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%',
                          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1.5px solid rgba(255,255,255,0.3)',
                        }}>
                          <span style={{ fontSize: '16px', marginLeft: '3px' }}>▶</span>
                        </div>
                      </div>
                      {/* Badge plataforma */}
                      <div style={{
                        position: 'absolute', top: '8px', left: '8px',
                        padding: '3px 8px', borderRadius: '100px',
                        background: corPlat,
                      }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: 'white', letterSpacing: '0.05em' }}>{labelPlat}</span>
                      </div>
                    </div>
                    {/* Rodapé */}
                    <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ margin: 0, flex: 1, fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hl.titulo ?? `Assistir no ${labelPlat}`}
                      </p>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>↗</span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Card compartilhável — só visível para o dono ── */}
        {isOwner && (
          <div style={{ marginTop: '20px' }}>
            <CardShare
              nome={nome}
              pos={pos}
              posicao={posicao}
              ovr={ovr}
              categoria={categoria}
              fotoUrl={fotosArray[0] ?? null}
              initials={initials}
              athleteId={athleteId}
              cidade={cidade || null}
              idade={dataNasc ? (() => {
                const h = new Date(), n = new Date(dataNasc)
                let a = h.getFullYear() - n.getFullYear()
                const m = h.getMonth() - n.getMonth()
                if (m < 0 || (m === 0 && h.getDate() < n.getDate())) a--
                return a
              })() : null}
              profileUrl={`${SERVER_BASE_URL}/jogador/${id}`}
            />
          </div>
        )}

        {/* ── Compartilhar ── */}
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`⚽ ${nome} – OVR ${ovr ?? '?'} no Meu Craque!\nConfira o perfil completo:\n${SERVER_BASE_URL}/jogador/${id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, padding: '12px', borderRadius: '12px',
              background: '#25D366', color: 'white',
              fontWeight: 800, fontSize: '13px', textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp
          </a>
          <CopiarLink url={`${SERVER_BASE_URL}/jogador/${id}`} />
        </div>

        {/* ── CTA Scout ── */}
        <div style={{
          marginTop: '20px', padding: '20px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            Você é scout ou representa um clube?
          </p>
          <Link href="/scout/busca" style={{
            display: 'inline-block', marginTop: '10px', padding: '11px 24px', borderRadius: '12px',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            color: '#22c55e', fontWeight: 700, fontSize: '13px', textDecoration: 'none',
          }}>
            🔍 Buscar mais atletas →
          </Link>
        </div>

        {/* CTA atleta */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link href="/cadastro" style={{
            display: 'inline-block', padding: '13px 28px', borderRadius: '14px',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            color: '#22c55e', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
          }}>
            Criar meu currículo grátis →
          </Link>
          <p style={{ margin: '12px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>
            O palco digital do futebol brasileiro
          </p>
        </div>

      </div>
    </main>
  )
}
