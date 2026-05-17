/**
 * /jogador/[id] — Currículo público do atleta
 * Acessível sem login. Compartilhável no story / WhatsApp / grupos.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrSingle } from '@/lib/ovr'
import VisitTracker from './VisitTracker'
import CopiarLink from './CopiarLink'
import FavoritoButton from './FavoritoButton'

type Props = { params: Promise<{ id: string }> }

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

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

export default async function JogadorPublicoPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: { user }, error } = await admin.auth.admin.getUserById(id)
  if (error || !user) notFound()

  const meta = user.user_metadata as {
    nome?: string; posicao?: string; cidade?: string; tipo?: string
    visit_count?: number; favorito_count?: number
    telefone?: string
    clubes_anteriores?: string
    campeonatos?: string
    titulos?: string
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

  const { data: profile } = await admin
    .from('profiles')
    .select('athlete_id, data_nascimento, bio, altura, peso, pe_dominante, clube_atual, avatar_url')
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
  // +1 porque esta visita ainda não foi contabilizada (acontece client-side após render)
  const visitCount     = (meta.visit_count     ?? 0) + 1
  const favoritoCount  = meta.favorito_count   ?? 0

  // Busca OVR + última avaliação (atributos detalhados para scouts)
  type AvaliacaoDetalhada = {
    velocidade: number; visao_jogo: number; forca: number
    finalizacao: number; posicionamento: number; tecnica: number
    scout_score: number; observacao: string | null; professor_id: string
    created_at: string
  }

  const [categoria, ovr, ultimaAv] = await Promise.all([
    Promise.resolve(dataNasc ? calcularCategoria(dataNasc) : null),
    athleteId ? fetchOvrSingle(admin, athleteId) : Promise.resolve(null),
    // Última avaliação com atributos detalhados (via auth UUID direto)
    admin.from('avaliacoes')
      .select('velocidade, visao_jogo, forca, finalizacao, posicionamento, tecnica, scout_score, observacao, professor_id, created_at')
      .eq('aluno_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(r => r.data as AvaliacaoDetalhada | null)
      .catch(() => null),
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
  const temCurriculo = bio || temFisico || clubeAtual || clubesAnteriores || campeonatosTexto || titulosTexto

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
        .pub-card { animation: cardIn .5s cubic-bezier(.22,.68,0,1.2) forwards; }
        .pub-ovr  { animation: ovrIn .5s cubic-bezier(.22,.68,0,1.2) forwards .3s, glowPulse 3s ease-in-out infinite 1s; opacity:0; }
        .curr-section { animation: cardIn .5s ease forwards; }
      `}</style>

      {/* Rastreia visita silenciosamente (client) */}
      <VisitTracker athleteUserId={id} />

      <div style={{ maxWidth: '380px', margin: '0 auto' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link
            href="/scout/busca"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)',
              textDecoration: 'none', padding: '6px 12px',
              borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              transition: 'color .15s',
            }}
          >
            ← Busca
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

          {/* Topo degradê */}
          <div style={{
            position: 'relative', minHeight: '148px',
            background: 'linear-gradient(160deg,#166534 0%,#052e16 100%)',
            backgroundImage: 'linear-gradient(160deg,#166534 0%,#052e16 100%), repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 28px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '20px 16px 0',
          }}>
            {/* Badges */}
            <div style={{
              position: 'absolute', top: '14px', left: '14px', right: '14px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              zIndex: 10,
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px', padding: '4px 10px',
                fontSize: '10px', fontWeight: 800, color: 'white', letterSpacing: '0.08em',
              }}>{pos}</div>
              {categoria
                ? <div style={{
                    background: 'rgba(34,197,94,0.18)', border: '1px solid rgba(34,197,94,0.35)',
                    borderRadius: '8px', padding: '4px 10px',
                    fontSize: '10px', fontWeight: 800, color: '#4ade80', letterSpacing: '0.06em',
                  }}>{categoria}</div>
                : <div />
              }
            </div>

            {/* OVR */}
            <div className="pub-ovr" style={{ textAlign: 'center', marginTop: '12px' }}>
              <div style={{ fontSize: '76px', fontWeight: 900, color: ovr ? 'white' : 'rgba(255,255,255,0.18)', lineHeight: 1, letterSpacing: '-0.05em' }}>
                {ovr ?? '—'}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginTop: '4px' }}>
                {ovr ? 'Overall' : 'Sem avaliação'}
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-34px', position: 'relative', zIndex: 2 }}>
            <div style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: 'linear-gradient(135deg,#15803d,#4ade80)',
              border: '3px solid #0b1610',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: 900, color: 'white',
              boxShadow: '0 8px 28px rgba(34,197,94,0.45)',
              overflow: 'hidden',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : initials}
            </div>
          </div>

          {/* Dados */}
          <div style={{ padding: '12px 20px 22px', textAlign: 'center' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800, color: 'white' }}>{nome}</h1>
            <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {posicao}{cidade ? ` · ${cidade}` : ''}
            </p>
            {clubeAtual && (
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                ⚽ {clubeAtual}
              </p>
            )}
            {!clubeAtual && <div style={{ marginBottom: '14px' }} />}

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

            {/* CTA */}
            <Link href="/cadastro" style={{
              display: 'block', padding: '13px', borderRadius: '14px',
              background: '#22c55e', color: 'black', fontWeight: 800,
              fontSize: '14px', textDecoration: 'none', textAlign: 'center',
            }}>
              Você é o próximo → Criar meu perfil
            </Link>
          </div>
        </div>

        {/* ── Avaliação detalhada (scout) ── */}
        {ultimaAv && (
          <div className="curr-section" style={{
            background: '#0b1610', border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: '18px', padding: '20px', marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Avaliação oficial
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  {treinadorNome ?? 'Treinador certificado'} · {new Date(ultimaAv.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                      <div style={{
                        height: '100%', borderRadius: '3px',
                        background: `linear-gradient(90deg, ${cor}80, ${cor})`,
                        width: `${pct}%`,
                        boxShadow: `0 0 6px ${cor}40`,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
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
          <div className="curr-section" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

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

          </div>
        )}

        {/* ── Compartilhar ── */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`⚽ ${nome} – OVR ${ovr ?? '?'} no Meu Craque!\nConfira o perfil completo:\nhttps://meucraque.com.br/jogador/${id}`)}`}
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
          <CopiarLink url={`https://meucraque.com.br/jogador/${id}`} />
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
