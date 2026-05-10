/**
 * /jogador/[id] — Currículo público do atleta
 * Acessível sem login. Compartilhável no story / WhatsApp / grupos.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'

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

export default async function JogadorPublicoPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: { user }, error } = await admin.auth.admin.getUserById(id)
  if (error || !user) notFound()

  const meta = user.user_metadata as {
    nome?: string; posicao?: string; cidade?: string; tipo?: string
  }

  if (meta?.tipo !== 'atleta') notFound()

  const nome    = meta.nome    ?? 'Atleta'
  const posicao = meta.posicao ?? ''
  const cidade  = meta.cidade  ?? ''

  const { data: profile } = await admin
    .from('profiles')
    .select('data_nascimento, bio, altura, peso, pe_dominante, clube_atual')
    .eq('id', id)
    .single()

  const dataNasc    = profile?.data_nascimento as string | null
  const bio         = (profile?.bio          as string | null) ?? null
  const altura      = profile?.altura         as number | null ?? null
  const peso        = profile?.peso           as number | null ?? null
  const peDominante = (profile?.pe_dominante  as string | null) ?? null
  const clubeAtual  = (profile?.clube_atual   as string | null) ?? null

  const categoria = dataNasc ? calcularCategoria(dataNasc) : null
  const ovr       = calcularOVR(nome)
  const initials  = getInitials(nome)
  const pos       = posAbrev(posicao)

  const temFisico   = altura || peso || peDominante
  const temCurriculo = bio || temFisico || clubeAtual

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

      <div style={{ maxWidth: '380px', margin: '0 auto' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ fontSize: '16px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.04em' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </Link>
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
              <div style={{ fontSize: '76px', fontWeight: 900, color: 'white', lineHeight: 1, letterSpacing: '-0.05em' }}>
                {ovr}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginTop: '4px' }}>
                Overall
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
            }}>
              {initials}
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
                <p style={{ margin: '0 0 2px', fontSize: '18px', fontWeight: 900, color: '#22c55e' }}>
                  {ovr}
                </p>
                <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall</p>
              </div>
            </div>

            {/* ── Seções premium travadas ── */}
            <div style={{
              background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '18px',
            }}>
              <p style={{ margin: '0 0 14px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Disponível com perfil premium
              </p>
              {[
                { icon: '🎬', label: 'Vídeo destaque', desc: 'Melhores momentos em campo' },
                { icon: '📊', label: 'Estatísticas', desc: 'Gols · Assistências · Jogos' },
                { icon: '✅', label: 'Atleta verificado', desc: 'Perfil validado pela plataforma' },
                { icon: '🔍', label: 'Visível para scouts', desc: 'Apareço nas buscas de clubes' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  opacity: 0.45,
                }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'white' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{item.desc}</p>
                  </div>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>🔒</span>
                </div>
              ))}
            </div>

          </div>
        )}

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
