'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MainAccountNav({ athlete = false, trainer = false }: { athlete?: boolean; trainer?: boolean }) {
  const pathname = usePathname()
  const onHome = pathname === '/' || pathname === '/feed'
  const isAthlete = athlete || pathname.startsWith('/atleta/')
  const isTrainer = trainer || pathname.startsWith('/treinador/')
  const onEvolution = pathname.startsWith('/atleta/evolucao') || pathname.startsWith('/treinador/caminhada')
  const items = [
    { href: '/', label: 'Home', icon: 'home', active: onHome },
    ...(isAthlete ? [{ href: '/atleta/evolucao', label: 'Minha evolução', icon: 'trend', active: onEvolution }] : []),
    ...(isTrainer ? [{ href: '/treinador/caminhada', label: 'Minha caminhada', icon: 'trend', active: onEvolution }] : []),
    { href: '/perfil', label: 'Perfil', icon: 'user', active: !onHome && !onEvolution },
  ]
  return <nav aria-label="Navegação principal" style={{
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', background: '#050a08f5', borderTop: '1px solid #385346',
    paddingBottom: 'env(safe-area-inset-bottom)', backdropFilter: 'blur(16px)',
  }}>
    {items.map(item =>
      <Link key={item.href} href={item.href} aria-current={item.active ? 'page' : undefined}
        style={{ flex: 1, minHeight: 62, display: 'flex', flexDirection: 'column', gap: 4,
          alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          color: item.active ? '#b3f737' : '#c4d0c9', fontSize: 13, fontWeight: 800 }}>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {item.icon === 'home' ? <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></> : item.icon === 'trend' ? <><path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-7"/><path d="M16 6h4v4"/></> : <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>}
        </svg>{item.label}
      </Link>)}
  </nav>
}
