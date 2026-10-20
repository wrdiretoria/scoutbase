/**
 * GET /api/conexoes
 * Lista as conexões aceitas e as solicitações pendentes (recebidas/enviadas) do usuário logado.
 * Resposta: { aceitas, pendentesRecebidas, pendentesEnviadas } — cada item enriquecido com
 * { id, nome, avatarUrl } do outro perfil envolvido na conexão.
 *
 * POST /api/conexoes
 * Cria uma solicitação de conexão. Body: { addresseeId }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

type ConexaoRow = {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at: string | null
}

type PerfilResumo = { id: string; nome: string | null; avatarUrl: string | null }

async function buscarPerfis(admin: ReturnType<typeof createAdminClient>, ids: string[]) {
  const mapa = new Map<string, PerfilResumo>()
  if (ids.length === 0) return mapa
  const { data } = await admin.from('profiles').select('id, nome, avatar_url').in('id', ids)
  for (const p of data ?? []) {
    mapa.set(p.id as string, {
      id:        p.id as string,
      nome:      p.nome as string | null,
      avatarUrl: p.avatar_url as string | null,
    })
  }
  return mapa
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data: conexoes, error } = await supabase
      .from('connections')
      .select('id, requester_id, addressee_id, status, created_at, responded_at')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[conexoes] GET', error)
      return NextResponse.json({ error: 'Erro ao buscar conexões.' }, { status: 500 })
    }

    const rows = (conexoes ?? []) as ConexaoRow[]
    const outroIdDe = (c: ConexaoRow) => (c.requester_id === user.id ? c.addressee_id : c.requester_id)

    const admin  = createAdminClient()
    const perfis = await buscarPerfis(admin, Array.from(new Set(rows.map(outroIdDe))))
    const comPerfil = (c: ConexaoRow) => ({ ...c, perfil: perfis.get(outroIdDe(c)) ?? null })

    return NextResponse.json({
      aceitas:            rows.filter(c => c.status === 'accepted').map(comPerfil),
      pendentesRecebidas: rows.filter(c => c.status === 'pending' && c.addressee_id === user.id).map(comPerfil),
      pendentesEnviadas:  rows.filter(c => c.status === 'pending' && c.requester_id === user.id).map(comPerfil),
    })
  } catch (err) {
    console.error('[conexoes] GET unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { addresseeId } = await req.json() as { addresseeId?: string }
    if (!addresseeId?.trim()) {
      return NextResponse.json({ error: 'addresseeId é obrigatório.' }, { status: 400 })
    }
    if (addresseeId === user.id) {
      return NextResponse.json({ error: 'Você não pode se conectar com você mesmo.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: destino } = await admin.from('profiles').select('id').eq('id', addresseeId).maybeSingle()
    if (!destino) return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 })

    // Impede duplicata em qualquer direção (A→B ou B→A)
    const { data: existente } = await supabase
      .from('connections')
      .select('id, status')
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),` +
        `and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`
      )
      .maybeSingle()

    if (existente) {
      return NextResponse.json(
        { error: existente.status === 'accepted' ? 'Vocês já estão conectados.' : 'Já existe uma solicitação entre vocês.' },
        { status: 409 },
      )
    }

    const { data: conexao, error } = await supabase
      .from('connections')
      .insert({ requester_id: user.id, addressee_id: addresseeId, status: 'pending' })
      .select('id, requester_id, addressee_id, status, created_at, responded_at')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Já existe uma solicitação entre vocês.' }, { status: 409 })
      }
      console.error('[conexoes] POST', error)
      return NextResponse.json({ error: 'Erro ao criar solicitação.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, conexao })
  } catch (err) {
    console.error('[conexoes] POST unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
