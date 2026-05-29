'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard',      href: '/treinador/dashboard' },
  { label: 'Avaliar atleta', href: '/treinador/avaliar'   },
  { label: 'Meu perfil',     href: '/treinador/perfil'    },
]

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open, setOpen] = useState(false)

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navContent = (
    <>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.label + item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-gray-100 flex items-center px-4">
        {/* ☰ button — left */}
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-10 h-10 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo — centered absolutely */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-green-600 select-none no-underline">
          meucraque.com
        </Link>

        {/* Spacer — right (keeps logo visually centered) */}
        <div className="ml-auto w-10" />
      </div>

      {/* ── Mobile drawer backdrop ── */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!open}
      >
        {/* Dimmed overlay */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setOpen(false)}
        />

        {/* Sliding panel */}
        <aside
          className={`absolute top-0 left-0 w-64 h-full bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-green-600 no-underline">meucraque.com</Link>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Fechar menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {navContent}
        </aside>
      </div>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen flex-col">
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/" className="text-lg font-bold text-green-600 no-underline">meucraque.com</Link>
        </div>
        {navContent}
      </aside>
    </>
  )
}