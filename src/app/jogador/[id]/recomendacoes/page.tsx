/**
 * /jogador/[id]/recomendacoes — lista completa de recomendações do atleta.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import RecomendacoesSection from '../RecomendacoesSection'

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

type Props = { params: Promise<{ id: string }> }

export default async function RecomendacoesPage({ params }: Props) {
  const { id } = await params
  if (!isUuid(id)) notFound()

  const admin = createAdminClient()
  const { data: { user } } = await admin.auth.admin.getUserById(id)
  const meta = user?.user_metadata as { nome?: string; tipo?: string } | undefined
  if (!user || meta?.tipo !== 'atleta') notFound()

  let isOwner = false
  try {
    const supabase = await createServerClient()
    const { data: { user: visitor } } = await supabase.auth.getUser()
    isOwner = visitor?.id === id
  } catch { /* visitante anônimo */ }

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '380px', margin: '0 auto' }}>
        <Link
          href={`/jogador/${id}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px',
            fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
            padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          ← {meta?.nome ?? 'Perfil'}
        </Link>

        <h1 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 900, color: 'white' }}>
          Recomendações de {meta?.nome ?? 'Atleta'}
        </h1>

        <RecomendacoesSection subjectId={id} isOwner={isOwner} limit={100} />
      </div>
    </main>
  )
}
