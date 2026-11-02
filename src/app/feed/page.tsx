/**
 * /feed — vitrine pública do MeuCraque e feed de participação para usuários
 * autenticados. As ações privadas continuam protegidas pelas rotas existentes.
 */
import Link from 'next/link'
import type { ReactNode } from 'react'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { getNetworkStats } from '@/lib/network-stats'
import FeedCenter from './FeedCenter'
import QuickConnectButton from './QuickConnectButton'
import FeedStories from './FeedStories'
import styles from './FeedHome.module.css'

type IconName = 'home' | 'user' | 'trend' | 'target' | 'users' | 'search' | 'calendar' | 'cone' | 'club' | 'plus' | 'bell' | 'menu' | 'message' | 'compass' | 'video' | 'image' | 'event' | 'trophy'

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const }
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    trend: <><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/><path d="M16 6h4v4"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/><path d="m16 8 5-5"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    search: <><circle cx="10.8" cy="10.8" r="7.3"/><path d="m16.2 16.2 4.3 4.3"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01"/></>,
    cone: <><path d="m9 3-6 18h18L15 3zM6 12h12M8 7h8"/><path d="M3 21h18"/></>,
    club: <><path d="M12 2 3 5v7c0 5 4 8 9 10 5-2 9-5 9-10V5z"/><path d="M9 9h6v5H9zM12 14v3"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    message: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m4 6 8 7 8-7"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/></>,
    video: <><rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
    event: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="m9 16 2 2 4-4"/></>,
    trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/></>,
  }
  return <svg {...common}>{paths[name]}</svg>
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function profileHref(tipo: string | undefined) {
  if (tipo === 'atleta') return '/atleta/perfil'
  if (tipo === 'treinador') return '/treinador/perfil'
  if (tipo === 'scout') return '/scout/dashboard'
  if (tipo === 'clube') return '/clube/vagas'
  if (tipo === 'pais') return '/pais/perfil'
  return '/configuracoes'
}

function performanceHref(tipo: string | undefined) {
  return tipo === 'atleta' ? '/atleta/historico' : null
}


export default async function FeedPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [profile, stats] = user
    ? await (async () => {
        const admin = createAdminClient()
        const [profileResult, networkStats] = await Promise.all([
          admin.from('profiles').select('nome, avatar_url').eq('id', user.id).maybeSingle(),
          getNetworkStats(admin, user.id, user.id),
        ])
        return [profileResult.data, networkStats] as const
      })()
    : [null, null] as const

  const nome = user
    ? (profile?.nome as string | null) ?? (user.user_metadata?.nome as string | undefined) ?? 'Você'
    : 'MeuCraque'
  const avatar = (profile?.avatar_url as string | null) ?? null
  const tipo = user?.user_metadata?.tipo as string | undefined
  const perfil = profileHref(tipo)
  const desempenho = performanceHref(tipo)
  const firstName = nome.split(' ')[0]
  const signInHref = '/login?next=%2Ffeed'

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <details className={styles.menu}>
            <summary className={styles.menuButton} aria-label="Abrir menu"><Icon name="menu" size={27} /></summary>
            <nav className={styles.menuPanel} aria-label="Menu MeuCraque">
              <Link href="/feed"><Icon name="home" size={18} /> Início</Link>
              <Link href={user ? perfil : signInHref}><Icon name="user" size={18} /> Meu Perfil</Link>
              <Link href={user ? '/mensagens' : signInHref}><Icon name="users" size={18} /> Conexões</Link>
              <Link href="/vagas"><Icon name="target" size={18} /> Oportunidades</Link>
              <Link href="/ranking"><Icon name="search" size={18} /> Explorar atletas</Link>
              {!user && <Link href="/cadastro"><Icon name="plus" size={18} /> Criar conta</Link>}
            </nav>
          </details>
          <Link href="/feed" className={styles.brand} aria-label="MeuCraque, início">
            <span className={styles.brandMark} aria-hidden="true">
              <svg viewBox="0 0 64 54" role="presentation">
                <circle cx="32" cy="27" r="23" fill="currentColor" />
                <g fill="#101827" stroke="#101827" strokeWidth="1.8" strokeLinejoin="round">
                  <path d="m32 17 10 7-4 12H26l-4-12Z" />
                  <path d="m25 5 7 7 7-7M10 22l9-2-2-10M54 22l-9-2 2-10M15 42l10-2 2 9M49 42l-10-2-2 9" fill="none" />
                  <path d="m32 12 0 5M19 20l3 4M45 20l-3 4M25 40l1-4M39 40l-1-4" fill="none" />
                </g>
              </svg>
            </span>
            <span className={styles.brandCopy}>
              <strong>Meu<span>Craque</span></strong>
              <small>A plataforma de oportunidades<br className={styles.brandBreak} /> do atleta de futebol.</small>
            </span>
          </Link>
          <nav className={styles.desktopNav} aria-label="Navegação principal">
            <Link className={styles.activeNav} href="/feed"><Icon name="home" size={19} />Início</Link>
            {user ? <Link href={perfil}><Icon name="user" size={19} />Meu Perfil</Link> : <Link href="/ranking"><Icon name="search" size={19} />Atletas</Link>}
            {user ? (desempenho ? <Link href={desempenho}><Icon name="trend" size={19} />Desempenho</Link> : <span className={styles.disabledNav} aria-disabled="true" title="Área ainda não disponível para este perfil"><Icon name="trend" size={19} />Desempenho</span>) : <Link href="/treinadores"><Icon name="users" size={19} />Treinadores</Link>}
            <Link href="/vagas"><Icon name="target" size={19} />Oportunidades</Link>
            {user ? <Link href="/mensagens"><Icon name="message" size={19} />Mensagens</Link> : <Link href={signInHref}>Entrar</Link>}
          </nav>
          <div className={styles.headerActions}>
            {user && <button className={styles.notification} type="button" aria-label="Notificações indisponíveis" disabled><Icon name="bell" size={23} /></button>}
            {user ? <Link href={perfil} className={styles.avatarLink} aria-label={`Abrir perfil de ${nome}`}>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className={styles.headerAvatar} />
              ) : (
                <span className={styles.headerAvatarFallback}>{getInitials(nome)}</span>
              )}
            </Link> : <Link href={signInHref} className={styles.guestSignIn}>Entrar</Link>}
          </div>
        </header>

        <FeedStories user={user ? { id: user.id, name: nome, avatarUrl: avatar } : null} />

        <section className={styles.hero} aria-label="Boas-vindas ao MeuCraque">
          <div className={styles.heroPhoto} />
          <div className={styles.heroShade} />
          <div className={`${styles.heroCopy} ${!user ? styles.heroGuestCopy : ''}`}>
            {user ? <>
              <span className={styles.eyebrow}>SEU FUTEBOL. SUA TRAJETÓRIA.</span>
              <h1>Bem-vindo, <em>{firstName}!</em></h1>
              <p>Acompanhe sua evolução, conecte-se e descubra novas oportunidades.</p>
            </> : <>

              <h1>CRIE SEU PERFIL E SE CONECTE COM OPORTUNIDADES</h1>
              <p>Conheça atletas, clubes e oportunidades do futebol.</p>
            </>}
          </div>
          <div className={styles.heroNetwork}>
            {user ? <>
              <div className={styles.networkStat}><Icon name="users" size={18} /><span><strong>{stats?.connections ?? 0}</strong> {(stats?.connections ?? 0) === 1 ? 'conexão' : 'conexões'}</span></div>
              <Link href={perfil} className={styles.heroCta}>Completar perfil <span aria-hidden="true">›</span></Link>
            </> : <div className={styles.guestHeroActions}>
              <Link href="/atleta/cadastro" className={styles.heroCta}>Criar meu perfil de atleta</Link>
              <Link href="/ranking" className={styles.heroCtaSecondary}>Encontrar atletas</Link>
            </div>}
          </div>
        </section>

        <Link href="/atleta/questionario" className={styles.startCard}>
          <span className={styles.startCardIcon}><Icon name="target" size={28} /></span>
          <span className={styles.startCardCopy}>
            <small>Comece por aqui</small>
            <strong>Teste seu nível</strong>
          </span>
          <span className={styles.startCardArrow} aria-hidden="true">›</span>
        </Link>
        <nav className={styles.shortcutRow} aria-label="Áreas principais">
          <Link href="#journey" className={styles.shortcut}>
            <Icon name="compass" size={37} /><strong>Minha<br className={styles.mobileBreak} /> Jornada</strong>
          </Link>
          <Link href={user ? '/mensagens' : signInHref} className={styles.shortcut}>
            <Icon name="users" size={39} /><strong>Conexões</strong>
          </Link>
          <Link href="/vagas" className={styles.shortcut}>
            <Icon name="target" size={39} /><strong>Oportunidades</strong>
          </Link>
          {user && desempenho ? (
            <Link href={desempenho} className={styles.shortcut}><Icon name="trend" size={39} /><strong>Desempenho</strong></Link>
          ) : (
            <Link href={signInHref} className={styles.shortcut}><Icon name="trend" size={39} /><strong>Desempenho</strong></Link>
          )}
        </nav>

        <section id="journey" className={styles.journeyCard} aria-labelledby="journey-heading" style={{ marginBottom: 14 }}>
          <div className={styles.sideTitle}>
            <span className={styles.sideGlyph}><Icon name="compass" size={22} /></span>
            <div>
              <h2 id="journey-heading">Minha Jornada</h2>
              <p>{user && tipo !== 'atleta' ? 'Seu caminho no futebol.' : 'Desenvolvimento do atleta'}</p>
            </div>
          </div>
          {user && tipo !== 'atleta' ? (
            <Link href={perfil} className={styles.sideCta}>Completar perfil <span aria-hidden="true">›</span></Link>
          ) : (
            <>
              <p className={styles.journeyCopy}>Monte seu perfil esportivo, avalie seu nível e acompanhe sua evolução no futebol.</p>
              <Link href={user ? perfil : '/atleta/cadastro'} className={styles.sideCta}>
                {user ? 'Atualizar meu perfil' : 'Criar perfil de atleta'} <span aria-hidden="true">›</span>
              </Link>
              <Link href="/atleta/questionario" className={styles.sideCta}>Fazer autoavaliação <span aria-hidden="true">›</span></Link>
              <Link href={user ? '/atleta/historico' : '/login?next=%2Fatleta%2Fhistorico'} className={styles.sideCta}>
                Ver histórico de evolução <span aria-hidden="true">›</span>
              </Link>
            </>
          )}
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.feedColumn} aria-label="Feed da comunidade">
            <nav className={styles.feedTabs} aria-label="Filtros do feed">
              <Link className={styles.selectedTab} href="/feed">Feed</Link>
              <span aria-disabled="true" title="Filtro ainda não disponível">Para você</span>
              <span aria-disabled="true" title="Filtro do feed ainda não disponível">Oportunidades</span>
              <span aria-disabled="true" title="Filtro ainda não disponível">Clubes</span>
              <span aria-disabled="true" title="Filtro ainda não disponível">Conteúdos</span>
            </nav>
            <FeedCenter
              cardStyle={{}}
              currentUser={user ? { id: user.id, nome, avatarUrl: avatar } : null}
            />
          </section>

          <aside className={styles.rightRail}>
            <section className={styles.peopleCard}>
              <div className={styles.sideTitle}><span className={styles.sideGlyph}><Icon name="users" size={22} /></span><div><h2>Conexões</h2><p>Pessoas do futebol para conhecer.</p></div></div>
              <div className={styles.suggestions}>{user ? <QuickConnectButton /> : <p>Entre na plataforma para se conectar com quem faz o futebol acontecer.</p>}</div>
              <Link href={user ? '/mensagens' : signInHref} className={styles.sideCta}>{user ? 'Abrir conexões' : 'Entrar para conectar'} <span aria-hidden="true">›</span></Link>
            </section>

            <Link href="/vagas" className={styles.opportunityCard}>
              <span className={styles.opportunityBall}><Icon name="target" size={24} /></span>
              <span><small>OPORTUNIDADES</small><strong>Seu próximo desafio</strong><em>Veja peneiras e vagas disponíveis.</em></span>
              <span className={styles.shortcutArrow} aria-hidden="true">›</span>
            </Link>
          </aside>
        </div>
      </div>

      <nav className={styles.mobileDock} aria-label="Navegação inferior">
        <Link className={styles.dockActive} href="/feed"><Icon name="home" size={23} />Início</Link>
        <Link href="/ranking"><Icon name="search" size={22} />Explorar</Link>
        <Link className={styles.dockPublish} href={user ? '#feed-composer' : signInHref} aria-label="Publicar"><Icon name="plus" size={27} /></Link>
        <Link href={user ? '/mensagens' : signInHref}><Icon name="users" size={23} />Conexões</Link>
        <Link href="#journey"><Icon name="trend" size={22} />Jornada</Link>
        <Link href={user ? perfil : signInHref}><Icon name="user" size={22} />{user ? 'Perfil' : 'Entrar'}</Link>
      </nav>
    </main>
  )
}
