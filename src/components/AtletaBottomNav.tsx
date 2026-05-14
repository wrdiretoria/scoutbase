'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type SharePayload = {
  nome: string
  posicao: string
  cidade: string
  dataNasc: string
  uid: string
  athleteId: string
  avatarUrl: string
}

const NAV_ITEMS = [
  { href: '/atleta/perfil',     icon: '👤', label: 'Perfil'      },
  { href: '/atleta/historico',  icon: '📈', label: 'Trajetória'  },
  { href: '/atleta/compartilhar', icon: '📲', label: 'Compartilhar' },
] as const

export default function AtletaBottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  const [share, setShare] = useState<SharePayload | null>(null)

  // Carrega dados para montar a URL de compartilhamento
  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const m = user.user_metadata as Record<string, string>

      const { data: profile } = await supabase
        .from('profiles')
        .select('athlete_id, avatar_url, data_nascimento')
        .eq('id', user.id)
        .single()

      if (cancelled) return
      setShare({
        nome:       m.nome      ?? 'Atleta',
        posicao:    m.posicao   ?? '',
        cidade:     m.cidade    ?? '',
        dataNasc:   (profile?.data_nascimento as string) ?? '',
        uid:        user.id,
        athleteId:  (profile?.athlete_id  as string) ?? '',
        avatarUrl:  (profile?.avatar_url  as string) ?? '',
      })
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleShare() {
    if (share) {
      const q = new URLSearchParams(share as Record<string, string>)
      router.push(`/atleta/compartilhar?${q.toString()}`)
    } else {
      // Fallback enquanto os dados carregam
      router.push('/atleta/perfil')
    }
  }

  function isActive(href: string) {
    if (href === '/atleta/compartilhar') return pathname.startsWith('/atleta/compartilhar')
    return pathname === href
  }

  return (
    <>
      <style>{`
        .mc-nav { display:flex; align-items:stretch; }

        .mc-nav-item {
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
        .mc-nav-item:active { opacity: .75; }

        .mc-nav-icon  { font-size: 20px; line-height: 1; transition: transform .15s; }
        .mc-nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.02em; transition: color .15s; white-space: nowrap; }

        .mc-nav-item.active .mc-nav-icon  { filter: drop-shadow(0 0 6px rgba(0,255,136,0.6)); }
        .mc-nav-item.active .mc-nav-label { font-weight: 800; }

        /* Active indicator — thin green pill at top of the item */
        .mc-nav-item.active::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 22px; height: 2.5px;
          border-radius: 0 0 3px 3px;
          background: #00FF88;
          box-shadow: 0 0 8px rgba(0,255,136,0.7);
        }

        .mc-nav-sep {
          width: 1px;
          background: rgba(255,255,255,0.06);
          margin: 10px 0;
          flex-shrink: 0;
        }

        .mc-logout {
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
        .mc-logout:active { opacity: .6; }
      `}</style>

      <nav style={{
        position:         'fixed',
        bottom:           0,
        left:             0,
        right:            0,
        zIndex:           100,
        background:       'rgba(4,10,6,0.94)',
        backdropFilter:   'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop:        '1px solid rgba(255,255,255,0.07)',
        paddingBottom:    'env(safe-area-inset-bottom)',
      }}>
        <div className="mc-nav">

          {/* Perfil */}
          <Link
            href="/atleta/perfil"
            className={`mc-nav-item${isActive('/atleta/perfil') ? ' active' : ''}`}
          >
            <span className="mc-nav-icon" style={{ color: isActive('/atleta/perfil') ? '#00FF88' : 'rgba(255,255,255,0.38)' }}>
              👤
            </span>
            <span className="mc-nav-label" style={{ color: isActive('/atleta/perfil') ? '#00FF88' : 'rgba(255,255,255,0.35)' }}>
              Perfil
            </span>
          </Link>

          {/* Trajetória */}
          <Link
            href="/atleta/historico"
            className={`mc-nav-item${isActive('/atleta/historico') ? ' active' : ''}`}
          >
            <span className="mc-nav-icon" style={{ color: isActive('/atleta/historico') ? '#00FF88' : 'rgba(255,255,255,0.38)' }}>
              📈
            </span>
            <span className="mc-nav-label" style={{ color: isActive('/atleta/historico') ? '#00FF88' : 'rgba(255,255,255,0.35)' }}>
              Trajetória
            </span>
          </Link>

          {/* Compartilhar — navegação programática com dados */}
          <button
            onClick={handleShare}
            className={`mc-nav-item${isActive('/atleta/compartilhar') ? ' active' : ''}`}
          >
            <span className="mc-nav-icon" style={{ color: isActive('/atleta/compartilhar') ? '#00FF88' : 'rgba(255,255,255,0.38)' }}>
              📲
            </span>
            <span className="mc-nav-label" style={{ color: isActive('/atleta/compartilhar') ? '#00FF88' : 'rgba(255,255,255,0.35)' }}>
              Compartilhar
            </span>
          </button>

          {/* Separador */}
          <div className="mc-nav-sep" />

          {/* Logout */}
          <button onClick={handleLogout} className="mc-logout">
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
