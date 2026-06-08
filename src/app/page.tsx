import Link from 'next/link'

export const revalidate = 60

import NavBar from './components/NavBar'
import CategoryNav from './components/CategoryNav'
import DestaquesSection from './components/DestaquesSection'
import MaisVisitadosSection from './components/MaisVisitadosSection'
import RecentAvaliacoesSection from './components/RecentAvaliacoesSection'
import RankingNacionalSection from './components/RankingNacionalSection'
import TreinadoresSection from './components/TreinadoresSection'
import CardExemplo from './components/CardExemplo'

export default async function LandingPage() {
  return (
    <div style={{ background: '#080808', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── 1. Header ── */}
      <NavBar />

      {/* Espaço abaixo do header fixo */}
      <div style={{ height: '64px' }} />

      {/* ── 2. Categorias horizontais ── */}
      <CategoryNav />

      {/* ── 3. Atletas em Destaque ── */}
      <DestaquesSection />

      {/* ── 4. Mais Visitados ── */}
      <MaisVisitadosSection />

      {/* ── 5. Recém Avaliados ── */}
      <RecentAvaliacoesSection />

      {/* ── 6. Ranking Nacional ── */}
      <RankingNacionalSection />

      {/* ── 7. Treinadores na Plataforma ── */}
      <TreinadoresSection />

      {/* ── 8. Card Exemplo ── */}
      <CardExemplo />

      {/* ── 9. Rodapé ── */}
      <footer style={{
        background: '#080808',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 24px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} MEUCRAQUE.com
          </span>
          <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
          <Link href="/termos" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>
            LGPD
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
          <Link href="/termos" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>
            Termos
          </Link>
        </div>
      </footer>

    </div>
  )
}
