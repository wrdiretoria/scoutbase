'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Alunos', href: '/alunos' },
  { label: 'Turmas', href: '/turmas' },
  { label: 'Presenças', href: '/presencas' },
  { label: 'Avaliações', href: '/avaliacoes' },
  { label: 'Relatórios', href: '/relatorios' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-lg font-bold text-green-600">ScoutBase</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  )
}
