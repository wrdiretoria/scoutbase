import Link from 'next/link'

export default function PaisLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-2">
        <Link href="/" className="font-bold text-lg" style={{ textDecoration: 'none' }}><span style={{ color: '#16a34a' }}>MEUCRAQUE</span><span style={{ color: '#00ff87' }}>.com</span></Link>
        <span className="text-xs text-gray-400 border border-gray-200 rounded px-2 py-0.5">Área dos Atletas</span>
      </header>
      {children}
    </div>
  )
}