import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import type { Institution } from '@/lib/institution'
import InstitutionForm from '../InstitutionForm'
import styles from '../institution.module.css'

export default async function InstitutionProfilePage() {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login?area=clube')
  const { data, error } = await client.from('institutional_profiles').select('*').eq('owner_id', user.id).maybeSingle()
  if (error) throw new Error('Não foi possível carregar o cadastro institucional.')
  if (!data) redirect('/clube/cadastro')
  const institution = data as Institution
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="MeuCraque, início">⚽ <span>MEUCRAQUE</span>.com</Link>
          <Link href="/">Início</Link>
        </header>
        <p>{institution.kind === 'clube' ? 'Clube' : 'Escolinha'}</p>
        <h1>{institution.nome}</h1>
        <span className={styles.status}>{institution.verification_status === 'verified' ? 'Instituição verificada' : 'Verificação pendente'}</span>
        <p>{institution.verification_status === 'verified' ? 'Cadastro institucional conferido.' : 'Seu CNPJ e o vínculo do responsável ainda precisam ser conferidos. Atualizar os dados reinicia essa conferência.'}</p>
        <nav className={styles.actions} aria-label="Ações da instituição">
          <Link href={'/clube/' + user.id}>Ver perfil público</Link>
          <Link href="/ranking">Explorar atletas</Link>
          {institution.verification_status === 'verified' && <Link href="/clube/vagas">Gerenciar oportunidades</Link>}
        </nav>
        <section className={styles.card}><InstitutionForm initial={institution} signedIn /></section>
      </div>
    </main>
  )
}
