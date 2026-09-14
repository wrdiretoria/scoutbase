/**
 * /mensagens — inbox de conversas do usuário logado.
 */
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import InboxList from './InboxList'

export default async function MensagensPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: '24px 20px 60px' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Link
            href="/feed"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none',
              padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            ← Feed
          </Link>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: 'white' }}>Mensagens</h1>
          <div style={{ width: '64px' }} />
        </div>

        <InboxList />
      </div>
    </main>
  )
}
