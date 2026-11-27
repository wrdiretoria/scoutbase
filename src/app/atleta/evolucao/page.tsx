import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { athleteMissions } from '@/lib/athlete-missions'
import AtletaBottomNav from '@/components/AtletaBottomNav'
import styles from './evolution.module.css'

export default async function AthleteEvolutionPage() {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login?next=%2Fatleta%2Fevolucao')
  if (user.user_metadata?.tipo !== 'atleta') redirect('/perfil')
  const [profileResult, videosResult] = await Promise.all([
    client.from('profiles').select('nome,avatar_url,data_nascimento,bio,fotos').eq('id', user.id).single(),
    client.from('highlights').select('titulo,url').eq('profile_id', user.id),
  ])
  if (profileResult.error || videosResult.error) throw new Error('Não foi possível carregar suas tarefas. Tente novamente.')
  const profile = profileResult.data
  const meta = user.user_metadata
  const missions = athleteMissions({
    avatarUrl: profile.avatar_url, position: typeof meta.posicao === 'string' ? meta.posicao : null,
    city: typeof meta.cidade === 'string' ? meta.cidade : null, birthDate: profile.data_nascimento,
    bio: profile.bio, photos: profile.fotos, highlights: videosResult.data ?? [],
  })
  const completed = missions.filter(item => item.done).length
  const percentage = Math.round(completed / missions.length * 100)
  const next = missions.find(item => !item.done)
  const groups = [...new Set(missions.map(item => item.group))]
  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><Link href="/" aria-label="MeuCraque, Home">⚽ <strong>MEUCRAQUE</strong>.com</Link><Link href="/perfil">Meu perfil</Link></header>
    <p className={styles.eyebrow}>UM PASSO DE CADA VEZ</p>
    <h1>Minha evolução</h1>
    <p className={styles.intro}>Treine, mostre seu futebol e cumpra as tarefas para construir sua presença como atleta.</p>
    <section className={styles.progressCard} aria-labelledby="progress-title">
      <div className={styles.progressTitle}><h2 id="progress-title">Seu progresso</h2><strong>{percentage}%</strong></div>
      <progress value={completed} max={missions.length} aria-label="Tarefas concluídas" />
      <p>{completed} de {missions.length} tarefas concluídas</p>
    </section>
    <section className={styles.next} aria-labelledby="next-title">
      <span className={styles.eyebrow}>{next ? 'SUA PRÓXIMA TAREFA' : 'ETAPA CONCLUÍDA'}</span>
      <h2 id="next-title">{next?.title ?? 'Sua base está pronta!'}</h2>
      <p>{next?.description ?? 'Continue treinando e atualizando os vídeos com os lances que melhor mostram seu jogo.'}</p>
      <Link className={styles.primary} href={next?.href ?? '/atleta/perfil#highlights'}>{next ? 'Cumprir tarefa' : 'Atualizar meus lances'} <span aria-hidden="true">→</span></Link>
    </section>
    <p className={styles.hint}>Salvou a foto, os dados ou o link? A tarefa correspondente aparece como concluída quando você volta aqui.</p>
    {groups.map((group, index) => <section key={group} className={styles.group} aria-labelledby={'group-' + index}>
      <div className={styles.groupTitle}><span>{String(index + 1).padStart(2, '0')}</span><h2 id={'group-' + index}>{group}</h2></div>
      {missions.filter(item => item.group === group).map(item => <article key={item.id} className={styles.task}>
        <span className={item.done ? styles.done : styles.todo} aria-label={item.done ? 'Concluída' : 'Pendente'}>{item.done ? '✓' : '○'}</span>
        <div><h3>{item.title}</h3><p>{item.description}</p>
          <Link href={item.href}>{item.done ? 'Concluída · Ver no perfil' : 'Fazer tarefa'} <span aria-hidden="true">›</span></Link>
        </div>
      </article>)}
    </section>)}
    <div className={styles.extras}>
      <Link href="/teste-seu-nivel"><strong>Teste seu nível</strong><span>Entenda sua preparação e o que você pode melhorar.</span></Link>
      <Link href="/atleta/historico"><strong>Minha trajetória</strong><span>Veja os registros e as avaliações que você já recebeu.</span></Link>
    </div>
  </div><AtletaBottomNav /></main>
}
