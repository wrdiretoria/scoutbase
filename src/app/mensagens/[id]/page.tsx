/**
 * /mensagens/[id] — thread de uma conversa.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import ThreadView from './ThreadView'

type Props = { params: Promise<{ id: string }> }

export default async function ConversaPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const { data: minhaParticipacao } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('conversation_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!minhaParticipacao) redirect('/mensagens')

  const { data: outroParticipante } = await admin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', id)
    .neq('user_id', user.id)
    .maybeSingle()

  const { data: outroPerfil } = outroParticipante
    ? await admin.from('profiles').select('id, nome, avatar_url').eq('id', outroParticipante.user_id).maybeSingle()
    : { data: null }

  const outro = outroPerfil
    ? { id: outroPerfil.id as string, nome: outroPerfil.nome as string | null, avatarUrl: outroPerfil.avatar_url as string | null }
    : null

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <Link
          href="/mensagens"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px',
            fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
            padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
          }}
        >
          ← Mensagens
        </Link>

        <ThreadView conversationId={id} meId={user.id} otherUser={outro} />
      </div>
    </main>
  )
}
