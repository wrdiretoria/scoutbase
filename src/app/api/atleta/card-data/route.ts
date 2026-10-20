import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { atributosDaAvaliacao } from '@/lib/escala'
import { categoriaDoAtleta } from '@/lib/categoria'

export const dynamic = 'force-dynamic'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i


export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id || !UUID_RE.test(id)) return NextResponse.json({ posicao: null, atributos: null, categoria: null })

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

    const meta        = userRes.data?.user?.user_metadata as { posicao?: string; pais?: string; nacionalidade?: string } | undefined
    const posicao     = meta?.posicao ?? null
    const nacionalidade = meta?.pais ?? meta?.nacionalidade ?? null
    const dataNasc = (profileRes.data?.data_nascimento as string | null) ?? null
    const av       = avRes.data

    const atributos = atributosDaAvaliacao(av)

    return NextResponse.json({
      posicao,
      atributos,
      categoria: categoriaDoAtleta(dataNasc),
      views: viewsRes.count ?? 0,
      nacionalidade,
    }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ posicao: null, atributos: null, categoria: null })
  }
}
