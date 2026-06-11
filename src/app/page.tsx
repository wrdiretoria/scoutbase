import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'MeuCraque — Plataforma de Futebol de Base',
  description: 'Crie seu perfil de atleta, seja avaliado por treinadores e apareça no ranking nacional. A plataforma do futebol de base brasileiro.',
  openGraph: {
    title: 'MeuCraque — Plataforma de Futebol de Base',
    description: 'Crie seu perfil de atleta, seja avaliado por treinadores e apareça no ranking nacional.',
    url: 'https://meucraque.com',
    siteName: 'MeuCraque',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeuCraque — Plataforma de Futebol de Base',
    description: 'Crie seu perfil de atleta, seja avaliado por treinadores e apareça no ranking nacional.',
  },
}

import TopBanner from './components/TopBanner'
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
    <div data-page="landing" style={{ background: '#080808', color: 'white', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── 1. Header ── */}
      <NavBar />

      {/* Espaço abaixo do header fixo */}
      <div style={{ height: '64px' }} />

      {/* ── 2. Faixa institucional ── */}
      <TopBanner />

      {/* ── 3. Categorias horizontais ── */}
      <CategoryNav />

      {/* ── 3. Novos Craques ── */}
      <RankingNacionalSection />

      {/* ── 4. Mais Visitados ── */}
      <MaisVisitadosSection />

      {/* ── 5. Atletas em Destaque ── */}
      <DestaquesSection />

      {/* ── 6. Recém Avaliados ── */}
      <RecentAvaliacoesSection />

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
