import { NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import { readInstitution } from '@/lib/institution'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let institution
    try {
      institution = readInstitution(body)
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Confira os dados.' }, { status: 400 })
    }
    if (body.acceptedTerms !== true) {
      return NextResponse.json({ error: 'É necessário aceitar os Termos de Uso.' }, { status: 400 })
    }
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Informe um e-mail válido e uma senha de 8 a 128 caracteres.' }, { status: 400 })
    }
    if (!await checkRateLimit('institution-signup:' + email, 5)) {
      return NextResponse.json({ error: 'Aguarde antes de tentar novamente.' }, { status: 429 })
    }
    const client = await createServerClient()
    const { data: { user: currentUser } } = await client.auth.getUser()
    if (currentUser) {
      return NextResponse.json({ error: 'Saia da conta atual antes de criar uma instituição.' }, { status: 409 })
    }
    const admin = createAdminClient()
    if (institution.cnpj !== null) {
      const existing = await admin.from('institutional_profiles').select('owner_id').eq('cnpj', institution.cnpj).maybeSingle()
      if (existing.error) throw existing.error
      if (existing.data) {
        return NextResponse.json({ error: 'Este CNPJ já possui cadastro. Entre na conta da instituição.' }, { status: 409 })
      }
    }
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { data: { nome: institution.nome, tipo: 'clube' } },
    })
    if (error || !data.user || data.user.identities?.length === 0) {
      return NextResponse.json({ error: 'Não foi possível criar a conta. Se já tem cadastro, entre ou recupere sua senha.' }, { status: 400 })
    }
    const { error: saveError } = await admin.from('institutional_profiles').insert({
      owner_id: data.user.id, ...institution,
    })
    if (saveError) {
      console.error('[institution signup]', saveError.code)
      return NextResponse.json({
        error: 'O acesso foi criado, mas o cadastro institucional ficou pendente. Entre com seu e-mail para concluir.',
      }, { status: 503 })
    }
    return NextResponse.json({ ok: true, needsConfirmation: !data.session }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Não foi possível concluir. Confira a conexão e tente novamente.' }, { status: 503 })
  }
}
