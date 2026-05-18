import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMap } from '@/lib/ovr'
import { NextResponse } from 'next/server'

const PER_PAGE = 12

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

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'))

  const admin = createAdminClient()

  const { data: { users }, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: 'Erro ao buscar atletas' }, { status: 500 })

  const atletaUsers = users.filter(u => u.user_metadata?.tipo === 'atleta')
  const total = atletaUsers.length
  const start = (page - 1) * PER_PAGE
  const slice = atletaUsers.slice(start, start + PER_PAGE)

  if (slice.length === 0) {
    return NextResponse.json({ atletas: [], hasMore: false, total, page })
  }

  const ids = slice.map(u => u.id)

  const [profilesRes, ovrMap] = await Promise.all([
    admin
      .from('profiles')
      .select('id, nome, avatar_url, athlete_id, data_nascimento')
      .in('id', ids),
    fetchOvrMap(admin),
  ])

  const profileMap = new Map((profilesRes.data ?? []).map(p => [p.id, p]))

  const atletas = slice.map(u => {
    const meta = u.user_metadata as { nome?: string; posicao?: string; cidade?: string; estado?: string }
    const profile = profileMap.get(u.id)
    const nome = (profile?.nome as string | null) ?? meta.nome ?? 'Atleta'
    const athleteId = (profile?.athlete_id as string | null) ?? null
    const dataNasc = (profile?.data_nascimento as string | null) ?? null
    const ovr = athleteId ? (ovrMap.get(athleteId) ?? null) : null
    const avatarUrl = (profile?.avatar_url as string | null) ?? null
    const categoria = dataNasc ? calcularCategoria(dataNasc) : null

    return {
      id: u.id,
      nome,
      posicao: meta.posicao ?? '',
      posicaoAbrev: posAbrev(meta.posicao ?? ''),
      cidade: meta.cidade ?? '',
      estado: meta.estado ?? '',
      ovr,
      avatarUrl,
      dataNasc,
      categoria,
    }
  })

  return NextResponse.json(
    { atletas, hasMore: start + PER_PAGE < total, total, page },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
