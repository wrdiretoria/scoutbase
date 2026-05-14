'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function TreinadorBottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      <style>{`
        .tc-nav { display:flex; align-items:stretch; }

        .tc-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 10px 4px 8px;
          background: none;
          border: none;
          cursor: pointer;
          text-decoration: none;
          font-family: system-ui, sans-serif;
          position: relative;
          transition: opacity .15s;
          -webkit-tap-highlight-color: transparent;
          min-height: 54px;
        }
        .tc-nav-item:active { opacity: .75; }

        .tc-nav-icon  { font-size: 20px; line-height: 1; transition: transform .15s; }
        .tc-nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.02em; transition: color .15s; white-space: nowrap; }

        .tc-nav-item.active .tc-nav-icon  { filter: drop-shadow(0 0 6px rgba(0,255,136,0.6)); }
        .tc-nav-item.active .tc-nav-label { font-weight: 800; }

        /* Active indicator — thin green pill at top of the item */
        .tc-nav-item.active::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 22px; height: 2.5px;
          border-radius: 0 0 3px 3px;
          background: #00FF88;
          box-shadow: 0 0 8px rgba(0,255,136,0.7);
        }

        .tc-nav-sep {
          width: 1px;
          background: rgba(255,255,255,0.06);
          margin: 10px 0;
          flex-shrink: 0;
        }

        .tc-logout {
          flex: 0 0 52px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 10px 0 8px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: system-ui, sans-serif;
          min-height: 54px;
          -webkit-tap-highlight-color: transparent;
          transition: opacity .15s;
        }
        .tc-logout:active { opacity: .6; }
      `}</style>

      <nav style={{
        position:             'fixed',
        bottom:               0,
        left:                 0,
        right:                0,
        zIndex:               100,
        background:           'rgba(4,10,6,0.94)',
        backdropFilter:       'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop:            '1px solid rgba(255,255,255,0.07)',
        paddingBottom:        'env(safe-area-inset-bottom)',
      }}>
        <div className="tc-nav">

          {/* Dashboard */}
          <Link
            href="/treinador/dashboard"
            className={`tc-nav-item${isActive('/treinador/dashboard') ? ' active' : ''}`}
          >
            <span className="tc-nav-icon" style={{ color: isActive('/treinador/dashboard') ? '#00FF88' : 'rgba(255,255,255,0.38)' }}>
              🏠
            </span>
            <span className="tc-nav-label" style={{ color: isActive('/treinador/dashboard') ? '#00FF88' : 'rgba(255,255,255,0.35)' }}>
              Dashboard
            </span>
          </Link>

          {/* Avaliar */}
          <Link
            href="/treinador/avaliar"
            className={`tc-nav-item${isActive('/treinador/avaliar') ? ' active' : ''}`}
          >
            <span className="tc-nav-icon" style={{ color: isActive('/treinador/avaliar') ? '#00FF88' : 'rgba(255,255,255,0.38)' }}>
              ⭐
            </span>
            <span className="tc-nav-label" style={{ color: isActive('/treinador/avaliar') ? '#00FF88' : 'rgba(255,255,255,0.35)' }}>
              Avaliar
            </span>
          </Link>

          {/* Perfil */}
          <Link
            href="/treinador/perfil"
            className={`tc-nav-item${isActive('/treinador/perfil') ? ' active' : ''}`}
          >
            <span className="tc-nav-icon" style={{ color: isActive('/treinador/perfil') ? '#00FF88' : 'rgba(255,255,255,0.38)' }}>
              👤
            </span>
            <span className="tc-nav-label" style={{ color: isActive('/treinador/perfil') ? '#00FF88' : 'rgba(255,255,255,0.35)' }}>
              Perfil
            </span>
          </Link>

          {/* Separador */}
          <div className="tc-nav-sep" />

          {/* Logout */}
          <button onClick={handleLogout} className="tc-logout">
            <span style={{ fontSize: '16px', lineHeight: 1, color: 'rgba(255,255,255,0.22)' }}>
              ⎋
            </span>
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>
              Sair
            </span>
          </button>

        </div>
      </nav>
    </>
  )
}
