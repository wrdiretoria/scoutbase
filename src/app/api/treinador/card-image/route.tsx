/**
 * GET /api/treinador/card-image?id=<userId>
 * Gera o card do treinador como PNG 600×800 no servidor usando ImageResponse.
 * Alta qualidade, sem html2canvas.
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

  const nome: string         = (p?.nome as string) ?? 'Treinador'
  const avatar_url: string   = (p?.avatar_url as string) ?? ''
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
  const ovr  = calcularOVR(av, dest, !!avatar_url, !!especialidade)

  const primeiroNome = nome.split(' ')[0]
  const sobrenome    = nome.split(' ').slice(1).join(' ')
  const initials     = getInitials(nome)

  const W = 600
  const H = 800

  return new ImageResponse(
    (
      <div
        style={{
          width: W, height: H,
          display: 'flex', flexDirection: 'column',
          background: '#080400',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Glow âmbar de fundo */}
        <div style={{
          position: 'absolute', top: -100, left: '50%',
          transform: 'translateX(-50%)',
          width: 700, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.18) 0%, rgba(217,119,6,0.06) 40%, transparent 65%)',
          display: 'flex',
        }} />

        {/* CARD — ocupa a maior parte */}
        <div style={{
          position: 'absolute',
          top: 40, left: 40, right: 40, bottom: 180,
          borderRadius: 32,
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 0 0 1px rgba(251,191,36,0.35), 0 0 80px rgba(251,191,36,0.2), 0 40px 120px rgba(0,0,0,0.98)',
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
                width: 160, height: 160, borderRadius: '50%',
                background: 'linear-gradient(145deg,#78350f,#d97706,#fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 64, fontWeight: 900, color: 'white',
              }}>
                {initials}
              </div>
            </div>
          )}

          {/* Overlay escuro — forte o suficiente para texto legível em qualquer foto */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 28%, transparent 50%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.97) 100%)',
            display: 'flex',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.45) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.35) 100%)',
            display: 'flex',
          }} />

          {/* TRE badge — topo esquerdo */}
          <div style={{
            position: 'absolute', top: 20, left: 22,
            fontSize: 14, fontWeight: 900, color: '#fbbf24',
            letterSpacing: '0.14em',
            textShadow: '0 0 16px rgba(251,191,36,0.7)',
            display: 'flex',
          }}>
            TRE
          </div>

          {/* Especialidade badge — topo direito */}
          {especialidade ? (
            <div style={{
              position: 'absolute', top: 16, right: 18,
              background: 'rgba(10,5,0,0.85)',
              border: '1px solid rgba(251,191,36,0.4)',
              borderRadius: 9,
              padding: '5px 13px',
              fontSize: 12, fontWeight: 800, color: '#fbbf24',
              letterSpacing: '0.1em',
              display: 'flex',
            }}>
              {especialidade}
            </div>
          ) : null}

          {/* Bottom info */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '0 22px 24px',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Nome */}
            <div style={{
              fontSize: 52, fontWeight: 900, color: 'white',
              letterSpacing: '-0.04em', lineHeight: 1,
              textShadow: '0 2px 8px rgba(0,0,0,1), 0 4px 32px rgba(0,0,0,1)',
              display: 'flex',
            }}>
              {primeiroNome}
            </div>
            {sobrenome ? (
              <div style={{
                fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)',
                textTransform: 'uppercase', letterSpacing: '0.16em',
                marginTop: 2, marginBottom: 12,
                textShadow: '0 1px 6px rgba(0,0,0,1)',
                display: 'flex',
              }}>
                {sobrenome}
              </div>
            ) : <div style={{ marginBottom: 12, display: 'flex' }} />}

            {/* Treinador badge + cidade */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                background: 'rgba(251,191,36,0.14)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 7,
                padding: '5px 14px',
                fontSize: 13, fontWeight: 900, color: '#fbbf24',
                letterSpacing: '0.09em',
                display: 'flex',
              }}>
                ⚡ Treinador
              </div>
              {cidade ? (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'flex' }}>
                  · {cidade}
                </div>
              ) : null}
            </div>

            {/* Stats */}
            {av > 0 ? (
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', gap: 5,
                  background: 'rgba(10,5,0,0.8)',
                  border: '1px solid rgba(251,191,36,0.2)',
                  borderRadius: 8, padding: '5px 12px',
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>{av}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>avaliações</span>
                </div>
                {at > 0 ? (
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: 5,
                    background: 'rgba(10,5,0,0.8)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    borderRadius: 8, padding: '5px 12px',
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fbbf24' }}>{at}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>atletas</span>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Watermark */}
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)', display: 'flex' }} />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>Meu Craque</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)', display: 'flex' }} />
            </div>
          </div>

          {/* Corner brackets */}
          {[
            { top: -1, left: -1,     borderTop:    '2px solid rgba(251,191,36,0.85)', borderLeft:   '2px solid rgba(251,191,36,0.85)', borderTopLeftRadius:     24 },
            { top: -1, right: -1,    borderTop:    '2px solid rgba(251,191,36,0.85)', borderRight:  '2px solid rgba(251,191,36,0.85)', borderTopRightRadius:    24 },
            { bottom: -1, left: -1,  borderBottom: '2px solid rgba(251,191,36,0.3)',  borderLeft:   '2px solid rgba(251,191,36,0.3)',  borderBottomLeftRadius:  24 },
            { bottom: -1, right: -1, borderBottom: '2px solid rgba(251,191,36,0.3)',  borderRight:  '2px solid rgba(251,191,36,0.3)',  borderBottomRightRadius: 24 },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 28, height: 28, display: 'flex', ...s }} />
          ))}
        </div>

        {/* Footer branding */}
        <div style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.08em' }}>
            ⚽ <span style={{ color: 'rgba(0,255,136,0.5)' }}>MEUCRAQUE</span>.com
          </span>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    }
  )
}
