import { NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { readInstitution } from '@/lib/institution'

export async function POST(request: Request) {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Entre para salvar seu perfil.' }, { status: 401 })
  if (user.user_metadata?.tipo !== 'clube') {
    return NextResponse.json({ error: 'Use a conta institucional para salvar este perfil.' }, { status: 403 })
  }
  try {
    const body = await request.json()
    let institution
    try {
      institution = readInstitution(body)
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Confira os dados.' }, { status: 400 })
    }
    const admin = createAdminClient()
    const existing = await admin.from('institutional_profiles').select('owner_id').eq('owner_id', user.id).maybeSingle()
    if (existing.error) throw existing.error
    if (!existing.data && body.acceptedTerms !== true) {
      return NextResponse.json({ error: 'É necessário aceitar os Termos de Uso.' }, { status: 400 })
    }
    const { error } = await admin.from('institutional_profiles').upsert({
      owner_id: user.id, ...institution,
    }, { onConflict: 'owner_id' })
    if (error) {
      console.error('[institution profile]', error.code)
      return NextResponse.json({
        error: error.code === '23505' ? 'Este CNPJ já possui cadastro.' : 'Não foi possível salvar. Tente novamente.',
      }, { status: error.code === '23505' ? 409 : 503 })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Não foi possível salvar. Tente novamente.' }, { status: 503 })
  }
}
