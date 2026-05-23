import { createAdminClient, createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    // Apenas o próprio atleta pode editar seu currículo
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { userId, bio, altura, peso, peDominante, clubeAtual } = await req.json() as {
      userId?: string
      bio?: string
      altura?: number | null
      peso?: number | null
      peDominante?: string
      clubeAtual?: string
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId ausente.' }, { status: 400 })
    }

    // Garante que só edita o próprio perfil
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const admin = createAdminClient()

    // Bloqueia edição de currículo se atleta já completou 18 anos
    const { data: profileData } = await admin
      .from('profiles')
      .select('data_nascimento')
      .eq('id', userId)
      .maybeSingle()

    if (profileData?.data_nascimento) {
      const nasc = new Date(profileData.data_nascimento)
      const hoje = new Date()
      const idade = hoje.getFullYear() - nasc.getFullYear() -
        (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)
      if (idade >= 18) {
        return NextResponse.json({
          error: 'Perfil bloqueado para edição. O Meu Craque é exclusivo para atletas sub-18. Seu histórico e avaliações permanecem salvos.',
        }, { status: 403 })
      }
    }

    const patch: Record<string, unknown> = {}
    if (bio         !== undefined) patch.bio          = bio         || null
    if (altura      !== undefined) patch.altura        = altura      || null
    if (peso        !== undefined) patch.peso          = peso        || null
    if (peDominante !== undefined) patch.pe_dominante  = peDominante || null
    if (clubeAtual  !== undefined) patch.clube_atual   = clubeAtual  || null

    const { error } = await admin
      .from('profiles')
      .update(patch)
      .eq('id', userId)

    if (error) {
      console.error('[atleta/salvar-curriculo] db error:', error.code, error.message)
      return NextResponse.json(
        { error: `Erro ao salvar currículo. (${error.code})` },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[atleta/salvar-curriculo] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
