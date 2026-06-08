import Link from 'next/link'
import AtletaCardLanding from './AtletaCardLanding'

export default function CardExemplo() {
  return (
    <section style={{ background: '#080808', padding: '64px 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 24px' }}>

        {/* Título */}
        <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.22em', color: '#00e676', textTransform: 'uppercase' }}>
          SEU CARD
        </p>
        <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 900, color: 'white', letterSpacing: '-0.025em' }}>
          COMO FICA O SEU CARD
        </h2>
        <p style={{ margin: '0 0 36px', fontSize: '14px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
          Crie agora e compartilhe nas redes
        </p>

        {/* Card placeholder — dados visuais, sem atleta real */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <AtletaCardLanding
            nome="Seu Nome"
            ovr={null}
            foto={null}
            posicao={null}
            categoria={null}
            atributos={null}
            href="/atleta/cadastro"
            athleteId={null}
            width="200px"
          />
        </div>

        {/* CTA */}
        <Link href="/atleta/cadastro" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '16px 40px', borderRadius: '100px',
          background: 'linear-gradient(160deg,#00e676 0%,#00c853 100%)',
          color: '#020c05', fontWeight: 900, fontSize: '14px',
          textDecoration: 'none', letterSpacing: '0.10em',
          boxShadow: '0 6px 28px rgba(0,230,118,0.35)',
        }}>
          CRIAR MEU CARD — GRÁTIS
        </Link>

      </div>
    </section>
  )
}
