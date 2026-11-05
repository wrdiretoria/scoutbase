/**
 * GET /api/treinador/card-image?id=<userId>
 * Gera o card do treinador como PNG 1200×1600 no servidor usando ImageResponse.
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
  const W = 1200
  const H = 1600
  const lime = '#b3f737'
  const shield = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1400" viewBox="0 0 1000 1400"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#284431"/><stop offset="1" stop-color="#091510"/></linearGradient></defs><path d="M500 14 930 112 985 232 950 1040 850 1170 500 1380 150 1170 50 1040 15 232 70 112Z" fill="url(#g)" stroke="#b3f737" stroke-width="14"/><path d="M500 44 909 138 955 238 922 1026 828 1148 500 1346 172 1148 78 1026 45 238 91 138Z" fill="none" stroke="#5e8054" stroke-width="3"/></svg>`
  const frame = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(shield)}`
  const nameSize = nome.length > 20 ? 52 : nome.length > 14 ? 67 : 82

  return new ImageResponse(
    <div style={{ width: W, height: H, display: 'flex', position: 'relative', background: '#080f0c', color: '#f0f6f1', fontFamily: 'sans-serif' }}>
      <img src={frame} width={1000} height={1400} alt="" style={{ position: 'absolute', left: 100, top: 48 }} />
      <div style={{ position: 'absolute', top: 157, left: 0, width: W, display: 'flex', justifyContent: 'center', fontSize: 39, fontWeight: 800, letterSpacing: 4, color: lime }}>
        MEUCRAQUE
      </div>
      <div style={{ position: 'absolute', top: 232, left: 0, width: W, display: 'flex', justifyContent: 'center', fontSize: 27, letterSpacing: 5, color: '#c4d0c9' }}>
        CARTA DE TREINADOR
      </div>
      <div style={{ position: 'absolute', top: 305, left: 370, width: 460, height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 230, border: '6px solid #b3f737', overflow: 'hidden', background: '#162a20', fontSize: 120, fontWeight: 800 }}>
        {avatar_url ? <img src={avatar_url} width={448} height={448} alt="" style={{ objectFit: 'cover', objectPosition: 'center 30%', borderRadius: 224 }} /> : getInitials(nome)}
      </div>
      <div style={{ position: 'absolute', top: 804, left: 185, width: 830, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: nameSize, fontWeight: 900, lineHeight: 1.05 }}>{nome.toUpperCase()}</span>
        <span style={{ marginTop: 20, color: lime, fontSize: 34, fontWeight: 800 }}>{especialidade || 'Treinador de futebol'}</span>
        {cidade && <span style={{ marginTop: 10, color: '#c4d0c9', fontSize: 29 }}>{cidade}</span>}
      </div>
      <div style={{ position: 'absolute', top: 1030, left: 240, width: 720, display: 'flex', justifyContent: 'space-around', borderTop: '2px solid #385346', paddingTop: 24 }}>
        {[[av, 'AVALIAÇÕES'], [at, 'ATLETAS'], [dest, 'DESTAQUES']].map(([count, label]) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 230 }}>
            <span style={{ color: lime, fontSize: 65, fontWeight: 900 }}>{count}</span>
            <span style={{ color: '#c4d0c9', fontSize: 21, fontWeight: 800 }}>{label}</span>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 0, bottom: 70, width: W, display: 'flex', justifyContent: 'center', fontSize: 30, color: '#c4d0c9' }}>
        meucraque.com
      </div>
    </div>,
    { width: W, height: H },
  )
}
