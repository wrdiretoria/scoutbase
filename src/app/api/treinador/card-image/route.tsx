/**
 * GET /api/treinador/card-image?id=<userId>
 * Gera o card do treinador como PNG 1200×1600 no servidor usando ImageResponse.
 * Alta resolução (2× Retina), sem html2canvas.
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

function calcularOVR(av: number, dest: number, temFoto: boolean, temEspec: boolean): number {
  let ovr = 65
  if (temFoto) ovr += 12
  if (temEspec) ovr += 8
  ovr += Math.min(av * 2, 10)
  ovr += Math.min(dest * 3, 10)
  return Math.min(ovr, 99)
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('id')
  if (!userId) return new Response('id obrigatório', { status: 400 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('*').eq('id', userId).single()
  const p = profile as Record<string, unknown> | null

  const nome: string          = (p?.nome as string) ?? 'Treinador'
  const avatar_url: string    = (p?.avatar_url as string) ?? ''
  const especialidade: string = (p?.especialidade as string) ?? ''
  const cidade: string        = (p?.cidade as string) ?? ''

  const [{ count: totAv }, { data: pRows }, { count: totDest }] = await Promise.all([
    admin.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('professor_id', userId),
    admin.from('avaliacoes').select('aluno_id').eq('professor_id', userId),
    admin.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('professor_id', userId).gte('scout_score', 75),
  ]).catch(() => [{ count: 0 }, { data: [] }, { count: 0 }]) as [{ count: number | null }, { data: { aluno_id: string }[] | null }, { count: number | null }]

  const av   = totAv   ?? 0
  const at   = new Set((pRows ?? []).map((r: { aluno_id: string }) => r.aluno_id)).size
  const dest = totDest ?? 0
  calcularOVR(av, dest, !!avatar_url, !!especialidade) // calcula mas não exibe

  const primeiroNome = nome.split(' ')[0]
  const sobrenome    = nome.split(' ').slice(1).join(' ')
  const initials     = getInitials(nome)

  // 1200×1600 = qualidade Retina / 2×
  const W = 1200
  const H = 1600

  return new ImageResponse(
    (
      <div style={{
        width: W, height: H,
        display: 'flex', flexDirection: 'column',
        background: '#080400',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Glow âmbar de fundo */}
        <div style={{
          position: 'absolute', top: -200, left: '50%',
          transform: 'translateX(-50%)',
          width: 1400, height: 1200,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.18) 0%, rgba(217,119,6,0.06) 40%, transparent 65%)',
          display: 'flex',
        }} />

        {/* CARD */}
        <div style={{
          position: 'absolute',
          top: 80, left: 80, right: 80, bottom: 360,
          borderRadius: 64,
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 0 0 2px rgba(251,191,36,0.35), 0 0 160px rgba(251,191,36,0.2), 0 80px 240px rgba(0,0,0,0.98)',
        }}>

          {/* Foto ou initials */}
          {avatar_url ? (
            <img
              src={avatar_url}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'flex' }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, #2d1200 0%, #1a0a00 50%, #0d0500 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 320, height: 320, borderRadius: '50%',
                background: 'linear-gradient(145deg,#78350f,#d97706,#fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 128, fontWeight: 900, color: 'white',
              }}>
                {initials}
              </div>
            </div>
          )}

          {/* Overlay escuro top + bottom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.05) 25%, transparent 45%, rgba(0,0,0,0.3) 62%, rgba(0,0,0,0.98) 100%)',
            display: 'flex',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)',
            display: 'flex',
          }} />

          {/* TRE — topo esquerdo */}
          <div style={{
            position: 'absolute', top: 40, left: 44,
            fontSize: 28, fontWeight: 900, color: '#fbbf24',
            letterSpacing: '0.14em',
            display: 'flex',
          }}>
            TRE
          </div>

          {/* Especialidade — topo direito */}
          {especialidade ? (
            <div style={{
              position: 'absolute', top: 32, right: 36,
              background: 'rgba(10,5,0,0.88)',
              border: '2px solid rgba(251,191,36,0.5)',
              borderRadius: 18,
              padding: '10px 26px',
              fontSize: 24, fontWeight: 800, color: '#fbbf24',
              letterSpacing: '0.1em',
              display: 'flex',
            }}>
              {especialidade}
            </div>
          ) : null}

          {/* Bottom info — gradiente escuro sólido */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.94) 55%, transparent 100%)',
            padding: '96px 44px 56px',
            display: 'flex', flexDirection: 'column',
          }}>

            {/* Nome */}
            <div style={{
              fontSize: 116, fontWeight: 900, color: '#ffffff',
              letterSpacing: '-0.03em', lineHeight: 1,
              display: 'flex',
            }}>
              {primeiroNome}
            </div>

            {sobrenome ? (
              <div style={{
                fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase', letterSpacing: '0.16em',
                marginTop: 8, marginBottom: 28,
                display: 'flex',
              }}>
                {sobrenome}
              </div>
            ) : <div style={{ marginBottom: 28, display: 'flex' }} />}

            {/* Badge Treinador */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                background: 'rgba(251,191,36,0.2)',
                border: '2px solid rgba(251,191,36,0.65)',
                borderRadius: 16,
                padding: '12px 32px',
                fontSize: 30, fontWeight: 900, color: '#fde68a',
                letterSpacing: '0.06em',
                display: 'flex',
              }}>
                ⚡ Treinador
              </div>
              {cidade ? (
                <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'flex' }}>
                  · {cidade}
                </div>
              ) : null}
            </div>

            {/* Stats */}
            {av > 0 ? (
              <div style={{ marginTop: 28, display: 'flex', gap: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 12,
                  background: 'rgba(0,0,0,0.65)',
                  border: '2px solid rgba(251,191,36,0.45)',
                  borderRadius: 20, padding: '14px 28px',
                }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#fbbf24' }}>{av}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>avaliações</span>
                </div>
                {at > 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: 12,
                    background: 'rgba(0,0,0,0.65)',
                    border: '2px solid rgba(251,191,36,0.45)',
                    borderRadius: 20, padding: '14px 28px',
                  }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: '#fbbf24' }}>{at}</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>atletas</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Watermark */}
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>Meu Craque</span>
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', display: 'flex' }} />
            </div>
          </div>

          {/* Corner brackets */}
          {[
            { top: -1, left: -1,     borderTop:    '3px solid rgba(251,191,36,0.85)', borderLeft:   '3px solid rgba(251,191,36,0.85)', borderTopLeftRadius:     48 },
            { top: -1, right: -1,    borderTop:    '3px solid rgba(251,191,36,0.85)', borderRight:  '3px solid rgba(251,191,36,0.85)', borderTopRightRadius:    48 },
            { bottom: -1, left: -1,  borderBottom: '3px solid rgba(251,191,36,0.3)',  borderLeft:   '3px solid rgba(251,191,36,0.3)',  borderBottomLeftRadius:  48 },
            { bottom: -1, right: -1, borderBottom: '3px solid rgba(251,191,36,0.3)',  borderRight:  '3px solid rgba(251,191,36,0.3)',  borderBottomRightRadius: 48 },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 56, height: 56, display: 'flex', ...s }} />
          ))}
        </div>

        {/* Footer branding */}
        <div style={{
          position: 'absolute', bottom: 48, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
            ⚽ MEUCRAQUE.com
          </span>
        </div>
      </div>
    ),
    { width: W, height: H }
  )
}
