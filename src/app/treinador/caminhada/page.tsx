import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { trainerMissions } from '@/lib/trainer-missions'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'
import styles from '../../atleta/evolucao/evolution.module.css'

export default async function TrainerJourneyPage() {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login?area=treinador&next=%2Ftreinador%2Fcaminhada')
  if (user.user_metadata?.tipo !== 'treinador') redirect('/perfil')
  const [profileResult, postsResult] = await Promise.all([
    client.from('profiles').select('avatar_url,bio').eq('id',user.id).single(),
    client.from('feed_posts').select('body').eq('author_id',user.id).eq('type','update').order('created_at',{ascending:false}).limit(100),
  ])
  if (profileResult.error || postsResult.error) throw new Error('Não foi possível carregar sua caminhada. Tente novamente.')
  const hasPublication = (postsResult.data ?? []).some(post => post.body.trim() && !/^(Atualizou|Criou o perfil|Agora faz parte|Recebeu uma nova avaliação)/i.test(post.body.trim()))
  const missions = trainerMissions({ avatarUrl:profileResult.data.avatar_url, bio:profileResult.data.bio, metadata:user.user_metadata, hasPublication })
  const completed = missions.filter(item=>item.done).length
  const percentage = Math.round(completed / missions.length * 100)
  const next = missions.find(item=>!item.done)
  const groups = [...new Set(missions.map(item=>item.group))]
  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><Link href="/" aria-label="MeuCraque, Home">⚽ <strong>MEUCRAQUE</strong>.com</Link><Link href="/perfil">Meu perfil</Link></header>
    <p className={styles.eyebrow}>SEU TRABALHO NO FUTEBOL</p>
    <h1>Minha caminhada</h1>
    <p className={styles.intro}>Apresente sua experiência, mostre como você trabalha e participe da comunidade.</p>
    <section className={styles.progressCard} aria-labelledby="walk-progress">
      <div className={styles.progressTitle}><h2 id="walk-progress">Seu progresso</h2><strong>{percentage}%</strong></div>
      <progress value={completed} max={missions.length} aria-label="Tarefas concluídas" />
      <p>{completed} de {missions.length} tarefas concluídas</p>
    </section>
    <section className={styles.next} aria-labelledby="walk-next">
      <span className={styles.eyebrow}>{next ? 'SUA PRÓXIMA TAREFA' : 'ETAPA CONCLUÍDA'}</span>
      <h2 id="walk-next">{next?.title ?? 'Sua apresentação está pronta!'}</h2>
      <p>{next?.description ?? 'Continue compartilhando seu trabalho e mantenha seu currículo atualizado.'}</p>
      <Link className={styles.primary} href={next?.href ?? '/treinador/curriculo'}>{next ? 'Cumprir tarefa' : 'Atualizar meu currículo'} <span aria-hidden="true">→</span></Link>
    </section>
    <p className={styles.hint}>As tarefas são concluídas automaticamente com os dados salvos no currículo e suas publicações na comunidade.</p>
    {groups.map((group,index)=><section key={group} className={styles.group} aria-labelledby={'walk-group-'+index}>
      <div className={styles.groupTitle}><span>{String(index+1).padStart(2,'0')}</span><h2 id={'walk-group-'+index}>{group}</h2></div>
      {missions.filter(item=>item.group===group).map(item=><article key={item.id} className={styles.task}>
        <span className={item.done ? styles.done : styles.todo} aria-label={item.done ? 'Concluída' : 'Pendente'}>{item.done ? '✓' : '○'}</span>
        <div><h3>{item.title}</h3><p>{item.description}</p><Link href={item.href}>{item.done ? 'Concluída · Revisar' : 'Fazer tarefa'} <span aria-hidden="true">›</span></Link></div>
      </article>)}
    </section>)}
    <div className={styles.extras}>
      <Link href={'/treinador/'+user.id}><strong>Meu perfil público</strong><span>Veja como sua apresentação aparece na comunidade.</span></Link>
      <Link href="/treinador/dashboard"><strong>Meu trabalho com atletas</strong><span>Acesse seu painel de acompanhamento.</span></Link>
    </div>
  </div><TreinadorBottomNav /></main>
}
