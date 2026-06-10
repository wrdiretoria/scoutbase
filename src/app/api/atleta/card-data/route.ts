import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function calcCategoria(dataNasc: string | null): string | null {
  if (!dataNasc) return null
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ posicao: null, atributos: null, categoria: null })

  try {
    const admin = createAdminClient()

    const [userRes, profileRes, avRes, viewsRes] = await Promise.all([
      admin.auth.admin.getUserById(id),
      admin.from('profiles').select('data_nascimento').eq('id', id).single(),
      admin
        .from('avaliacoes')
        .select('velocidade, tecnica, finalizacao, forca, visao_jogo, posicionamento')
        .eq('aluno_id', id)
        .not('scout_score', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      admin.from('visitas').select('*', { count: 'exact', head: true }).eq('atleta_id', id),
    ])

    const meta     = userRes.data?.user?.user_metadata as { posicao?: string } | undefined
    const posicao  = meta?.posicao ?? null
    const dataNasc = (profileRes.data?.data_nascimento as string | null) ?? null
    const av       = avRes.data

    const atributos = av ? {
      vel: av.velocidade     as number | null,
      tec: av.tecnica        as number | null,
      dri: av.finalizacao    as number | null,
      fis: av.forca          as number | null,
      tat: av.visao_jogo     as number | null,
      pos: av.posicionamento as number | null,
    } : null

    return NextResponse.json({
      posicao,
      atributos,
      categoria: calcCategoria(dataNasc),
      views: viewsRes.count ?? 0,
    }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ posicao: null, atributos: null, categoria: null })
  }
}
