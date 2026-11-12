import { createAdminClient, createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { categoriaDoAtleta, erroIdadeCadastroAtleta } from '@/lib/categoria'

/** Corrige uma data ausente ou inválida no perfil do próprio atleta. */
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { dataNascimento } = await req.json() as { dataNascimento?: string }

    // Mesma validação do cadastro
    const erroNasc = erroIdadeCadastroAtleta(dataNascimento)
    if (erroNasc || !dataNascimento) {
      return NextResponse.json({ error: erroNasc ?? 'Informe sua data de nascimento.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('data_nascimento, athlete_id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile?.athlete_id) {
      return NextResponse.json({ error: 'Perfil de atleta não encontrado.' }, { status: 404 })
    }
    if (categoriaDoAtleta(profile.data_nascimento)) {
      return NextResponse.json({ error: 'Data de nascimento já cadastrada. Para corrigir, fale com o suporte.' }, { status: 409 })
    }

    const update = admin
      .from('profiles')
      .update({ data_nascimento: dataNascimento })
      .eq('id', user.id)
    const { data: updated, error } = await (profile.data_nascimento == null
      ? update.is('data_nascimento', null)
      : update.eq('data_nascimento', profile.data_nascimento))
      .select('id')
      .maybeSingle()

    if (error) {
      console.error('[atleta/data-nascimento] db error:', error.code, error.message)
      return NextResponse.json({ error: 'Erro ao salvar a data de nascimento.' }, { status: 500 })
    }
    if (!updated) return NextResponse.json({ error: 'Recarregue o perfil e tente novamente.' }, { status: 409 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[atleta/data-nascimento] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
