'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function MainAccountNav() {
  const pathname = usePathname()
  const onHome = pathname === '/' || pathname === '/feed'
  return <nav aria-label="Navegação principal" style={{
    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
    display: 'flex', background: '#050a08f5', borderTop: '1px solid #385346',
    paddingBottom: 'env(safe-area-inset-bottom)', backdropFilter: 'blur(16px)',
  }}>
    {[{ href: '/', label: 'Home', home: true }, { href: '/perfil', label: 'Perfil', home: false }].map(item =>
      <Link key={item.href} href={item.href} aria-current={onHome === item.home ? 'page' : undefined}
        style={{ flex: 1, minHeight: 62, display: 'flex', flexDirection: 'column', gap: 4,
          alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          color: onHome === item.home ? '#b3f737' : '#c4d0c9', fontSize: 13, fontWeight: 800 }}>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {item.home ? <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></> : <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>}
        </svg>{item.label}
      </Link>)}
  </nav>
}
