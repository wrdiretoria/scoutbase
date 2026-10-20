import { createAdminClient, createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { erroDataNascimento } from '@/lib/categoria'

/**
 * Preenche a data de nascimento do próprio atleta — SÓ se ainda estiver vazia.
 * Depois de gravada ela fica travada: trocar a data mudaria a categoria (e a
 * trava de idade), então correções passam pelo suporte.
 */
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { dataNascimento } = await req.json() as { dataNascimento?: string }

    // Mesma validação do cadastro
    const erroNasc = erroDataNascimento(dataNascimento)
    if (erroNasc || !dataNascimento) {
      return NextResponse.json({ error: erroNasc ?? 'Informe sua data de nascimento.' }, { status: 400 })
    }
    const nasc  = new Date(dataNascimento)
    const hoje  = new Date()
    const idade = hoje.getFullYear() - nasc.getFullYear()
      - (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate()) ? 1 : 0)
    if (idade > 20) {
      return NextResponse.json({ error: 'O Meu Craque é exclusivo para atletas do futebol de base (até Sub-20).' }, { status: 400 })
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
    if (profile.data_nascimento) {
      return NextResponse.json({ error: 'Data de nascimento já cadastrada. Para corrigir, fale com o suporte.' }, { status: 409 })
    }

    const { error } = await admin
      .from('profiles')
      .update({ data_nascimento: dataNascimento })
      .eq('id', user.id)
      .is('data_nascimento', null)

    if (error) {
      console.error('[atleta/data-nascimento] db error:', error.code, error.message)
      return NextResponse.json({ error: 'Erro ao salvar a data de nascimento.' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[atleta/data-nascimento] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
