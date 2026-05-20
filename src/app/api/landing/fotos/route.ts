import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export const revalidate = 0

type FotoItem = {
  userId:   string
  nome:     string
  posicao:  string
  cidade:   string
  ovr:      number | null
  fotos:    string[]   // só as não-nulas
}

export async function GET() {
  try {
    const admin = createAdminClient()

    // Atletas com pelo menos 1 foto na galeria
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, nome, cidade, fotos, athlete_id')
      .not('fotos', 'is', null)
      .order('created_at', { ascending: false })
      .limit(40)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // Filtra só quem tem fotos de fato
    const comFotos = profiles.filter(p => {
      const f = p.fotos as unknown
      return Array.isArray(f) && (f as (string | null)[]).some(Boolean)
    })

    if (comFotos.length === 0) {
      return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // Última avaliação de cada atleta (scout_score)
    const ids = comFotos.map(p => p.id as string)
    const { data: avs } = await admin
      .from('avaliacoes')
      .select('aluno_id, scout_score')
      .in('aluno_id', ids)
      .not('scout_score', 'is', null)
      .order('created_at', { ascending: false })

    // Map: userId → OVR (última avaliação)
    const ovrMap = new Map<string, number>()
    for (const av of avs ?? []) {
      if (!ovrMap.has(av.aluno_id as string)) {
        ovrMap.set(av.aluno_id as string, av.scout_score as number)
      }
    }

    // Busca posição de cada atleta via user_metadata (auth.users)
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const posMap = new Map<string, string>()
    for (const u of authData?.users ?? []) {
      const pos = u.user_metadata?.posicao as string | undefined
      if (pos) posMap.set(u.id, pos)
    }

    const items: FotoItem[] = comFotos.map(p => {
      const fotosArr = p.fotos as (string | null)[]
      return {
        userId:  p.id as string,
        nome:    p.nome as string ?? 'Atleta',
        posicao: posMap.get(p.id as string) ?? '',
        cidade:  p.cidade as string ?? '',
        ovr:     ovrMap.get(p.id as string) ?? null,
        fotos:   fotosArr.filter((f): f is string => !!f),
      }
    })

    return NextResponse.json({ items }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[landing/fotos]', err)
    return NextResponse.json({ items: [] })
  }
}
