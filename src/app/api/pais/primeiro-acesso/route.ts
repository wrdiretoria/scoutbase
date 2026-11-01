/**
 * POST /api/pais/primeiro-acesso
 * Body: { token: string, senha: string }
 *
 * Cria o acesso do responsável a partir do link privado que o treinador envia
 * (/p/[token]). O token é o segredo: o número do atleta (SID) é sequencial e
 * não pode servir para isso.
 *
 * - confere o token no servidor;
 * - cria a conta com e-mail sintético válido (sid-00001@pais.meucraque.com);
 * - grava alunos.pai_auth_id uma única vez (só se ainda estiver vazio);
 * - já deixa o responsável logado.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import { sidParaEmailPais } from '@/lib/pais'

const TOKEN_RE = /^[A-Za-z0-9_-]{4,128}$/

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!await checkRateLimit(`pais-primeiro-acesso:ip:${ip}`, 10)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({})) as { token?: string; senha?: string }
  const token = body.token?.trim() ?? ''
  const senha = body.senha ?? ''

  if (!TOKEN_RE.test(token)) {
    return NextResponse.json({ error: 'Link de acesso inválido.' }, { status: 400 })
  }
  if (senha.length < 8) {
    return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres.' }, { status: 400 })
  }
  if (!await checkRateLimit(`pais-primeiro-acesso:token:${token}`, 5)) {
    return NextResponse.json({ error: 'Muitas tentativas para este link. Tente novamente em 1 hora.' }, { status: 429 })
  }

  const admin = createAdminClient()
  const { data: aluno } = await admin
    .from('alunos')
    .select('id, nome, scout_id, pai_auth_id')
    .eq('token_acesso', token)
    .maybeSingle()

  if (!aluno) {
    return NextResponse.json({ error: 'Link de acesso inválido.' }, { status: 404 })
  }
  if (aluno.pai_auth_id) {
    return NextResponse.json(
      { error: 'Este atleta já tem um acesso de responsável. Use a aba "Já tenho conta".' },
      { status: 409 },
    )
  }
  if (!aluno.scout_id) {
    return NextResponse.json(
      { error: 'Este atleta ainda não tem número cadastrado. Fale com o treinador.' },
      { status: 409 },
    )
  }

  const email = sidParaEmailPais(aluno.scout_id)
  const { data: criado, error: criarErr } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { tipo: 'pai', aluno_scout_id: aluno.scout_id, aluno_nome: aluno.nome },
  })

  if (criarErr || !criado.user) {
    // E-mail já existe: conta antiga criada pelo número. /pais/perfil grava o
    // vínculo dela no primeiro login.
    const jaExiste = /already|registered|exists/i.test(criarErr?.message ?? '')
    return NextResponse.json(
      {
        error: jaExiste
          ? 'Já existe um acesso para este atleta. Use a aba "Já tenho conta".'
          : 'Não foi possível criar o acesso. Tente novamente.',
      },
      { status: jaExiste ? 409 : 500 },
    )
  }

  // Grava o vínculo só se continuar vazio (evita corrida entre dois pedidos).
  const { data: vinculado } = await admin
    .from('alunos')
    .update({ pai_auth_id: criado.user.id })
    .eq('id', aluno.id)
    .is('pai_auth_id', null)
    .select('id')
    .maybeSingle()

  if (!vinculado) {
    await admin.auth.admin.deleteUser(criado.user.id)
    return NextResponse.json(
      { error: 'Este atleta já tem um acesso de responsável. Use a aba "Já tenho conta".' },
      { status: 409 },
    )
  }

  // Login no servidor (cookies de sessão), sem expor o e-mail ao navegador.
  const supabase = await createServerClient()
  const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (loginErr) {
    return NextResponse.json({ ok: true, login: false, sid: aluno.scout_id })
  }

  return NextResponse.json({ ok: true, login: true })
}
