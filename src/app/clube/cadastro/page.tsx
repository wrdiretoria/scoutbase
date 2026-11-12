import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import InstitutionForm from '../InstitutionForm'
import styles from '../institution.module.css'

export default async function InstitutionSignupPage() {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (user?.user_metadata?.tipo === 'clube') {
    const { data } = await client.from('institutional_profiles').select('owner_id').eq('owner_id', user.id).maybeSingle()
    if (data) redirect('/clube/perfil')
  }
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="MeuCraque, início">⚽ <span>MEUCRAQUE</span>.com</Link>
          <Link href="/cadastro">Voltar</Link>
        </header>
        <h1>Seu clube ou escolinha no MeuCraque</h1>
        <p>Cadastre a instituição e identifique quem a representa.</p>
        <div className={styles.card}>
          {user && user.user_metadata?.tipo !== 'clube' ? <p>Você está em uma conta pessoal. Volte ao seu perfil e saia da conta para cadastrar uma instituição.</p> : <InstitutionForm signedIn={!!user} />}
        </div>
        <p>Escolinhas independentes podem criar um perfil sem CNPJ. O selo depende da conferência do CNPJ e do vínculo do responsável.</p>
      </div>
    </main>
  )
}
