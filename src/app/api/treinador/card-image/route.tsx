/**
 * GET /api/treinador/card-image?id=<userId>
 * Gera o card do treinador como PNG 800×1280 no servidor usando ImageResponse.
 * Alta resolução (2× Retina), sem html2canvas.
 */

import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const runtime = 'nodejs'

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
  const W = 800
  const H = 1280
  const gold = '#f3c66b'
  const ink = '#091610'
  const nameSize = nome.length > 24 ? 46 : nome.length > 16 ? 62 : 80

  return new ImageResponse(
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', overflow: 'hidden', borderRadius: 56, background: ink, color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'absolute', top: 152, left: 0, width: W, height: 756, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#162c22' }}>
        {avatar_url ? <img src={avatar_url} alt="" width={W} height={756} style={{ objectFit: 'cover', objectPosition: 'center 28%' }} /> : (
          <span style={{ color: gold, fontSize: 148, fontWeight: 800 }}>{getInitials(nome)}</span>
        )}
      </div>
      <div style={{ position: 'absolute', top: 490, left: 0, width: W, height: 418, display: 'flex', background: 'linear-gradient(180deg, rgba(9,22,16,0), #091610)' }} />
      <div style={{ position: 'absolute', top: 0, left: 56, right: 56, height: 152, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 57, color: gold, fontWeight: 900 }}>MeuCraque</span>
        <span style={{ fontSize: 24, color: '#d4e0d7', fontWeight: 800 }}>TREINADOR</span>
      </div>
      <div style={{ position: 'absolute', top: 770, left: 56, right: 56, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 36, color: gold, fontWeight: 800 }}>{especialidade || 'Treinador de futebol'}</span>
        <span style={{ fontSize: nameSize, lineHeight: 1.05, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</span>
        {cidade && <span style={{ color: '#d4e0d7', fontSize: 33 }}>{cidade}</span>}
      </div>
      <div style={{ position: 'absolute', top: 1008, left: 56, right: 56, borderTop: '2px solid #746044', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
        {[[av, 'Avaliações'], [at, 'Atletas'], [dest, 'Destaques']].map(([count, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 9, fontSize: 24, color: '#d4e0d7' }}>
            <span style={{ color: gold, fontSize: 37, fontWeight: 900 }}>{count}</span>
            {label}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 1134, left: 56, right: 56, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 39, fontWeight: 800 }}>Veja meu perfil completo</span>
        <span style={{ fontSize: 23, color: gold }}>{`meucraque.com/treinador/${userId}`}</span>
      </div>
    </div>,
    { width: W, height: H },
  )
}
