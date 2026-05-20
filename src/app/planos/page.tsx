import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planos | Meu Craque',
  description: 'Conheça os planos do Meu Craque. Perfil gratuito para atletas, avaliação oficial por R$ 9,90.',
}

export default function PlanosPage() {
  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
    }}>
      <style>{`
        .plan-card { transition: transform 0.2s, border-color 0.2s; }
        .plan-card:hover { transform: translateY(-4px); }
        .feat-row { display:flex; align-items:flex-start; gap:10px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); }
        .feat-row:last-child { border-bottom:none; }
      `}</style>

      {/* Nav */}
      <nav style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(6,16,10,0.95)',
        backdropFilter: 'blur(20px)', zIndex: 10,
      }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </Link>
        <Link href="/atleta/cadastro" style={{
          padding: '8px 16px', borderRadius: '10px', background: '#22c55e',
          color: 'black', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
        }}>
          Começar grátis
        </Link>
      </nav>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Simples assim
          </p>
          <h1 style={{ margin: '0 0 12px', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Perfil gratuito.<br />
            <span style={{ color: '#22c55e' }}>Avaliação por R$ 9,90.</span>
          </h1>
          <p style={{ margin: '0 auto', fontSize: '16px', color: 'rgba(255,255,255,0.45)', maxWidth: '480px', lineHeight: 1.6 }}>
            Crie seu perfil gratuitamente e, quando quiser ser avaliado por um treinador, compre um card de avaliação.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '48px' }}>

          {/* Gratuito */}
          <div className="plan-card" style={{
            padding: '28px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Atleta</p>
            <p style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 900 }}>Gratuito</p>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Para sempre. Sem cartão.</p>

            <div style={{ marginBottom: '24px' }}>
              {[
                '✅  Perfil público com ID de atleta',
                '✅  Foto + posição + cidade + estado',
                '✅  Entrada no ranking nacional',
                '✅  Contador de visitas no perfil',
                '✅  Card compartilhável (foto + OVR)',
                '✅  Link de indicação para amigos',
                '✅  Histórico de avaliações',
              ].map(f => (
                <div key={f} className="feat-row">
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/atleta/cadastro" style={{
              display: 'block', padding: '14px', borderRadius: '12px', textAlign: 'center',
              background: 'rgba(34,197,94,0.1)', color: '#22c55e',
              border: '1px solid rgba(34,197,94,0.25)',
              fontWeight: 800, fontSize: '14px', textDecoration: 'none',
            }}>
              Criar meu perfil →
            </Link>
          </div>

          {/* Card de Avaliação */}
          <div className="plan-card" style={{
            padding: '28px', borderRadius: '20px',
            background: 'linear-gradient(135deg,#052e16,#0b1a10)',
            border: '2px solid rgba(34,197,94,0.35)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-40px', left: '-40px',
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(34,197,94,0.12),transparent 70%)',
              pointerEvents: 'none',
            }} />

            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Card de Avaliação</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>R$ 9,90</p>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>por avaliação</span>
            </div>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Até 2 avaliações por mês.</p>

            <div style={{ marginBottom: '24px' }}>
              {[
                '✅  Tudo do perfil gratuito',
                '⚡  1 avaliação oficial de um treinador',
                '⚡  Você convida o treinador pelo ID dele',
                '⚡  Ou o treinador te chama pelo seu ID',
                '⚡  Atributos técnicos desbloqueados no perfil',
                '⚡  Avaliação compartilhável com qualquer pessoa',
              ].map(f => (
                <div key={f} className="feat-row">
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/atleta/cadastro" style={{
              display: 'block', padding: '14px', borderRadius: '12px', textAlign: 'center',
              background: '#22c55e', color: 'black',
              fontWeight: 800, fontSize: '14px', textDecoration: 'none',
            }}>
              Criar perfil e ser avaliado →
            </Link>
          </div>

        </div>

        {/* Para treinadores */}
        <div style={{
          padding: '32px', borderRadius: '20px',
          background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.15)',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Para treinadores e escolas</p>
              <p style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900 }}>Cadastro gratuito</p>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Avalie seus atletas, acompanhe a evolução deles e gerencie sua escola na plataforma.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Link href="/treinador/cadastro" style={{
                padding: '14px 24px', borderRadius: '12px',
                background: 'rgba(96,165,250,0.15)', color: '#60a5fa',
                border: '1px solid rgba(96,165,250,0.25)',
                fontWeight: 800, fontSize: '14px', textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}>
                Cadastrar escola →
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Dúvidas rápidas</p>

          {[
            {
              q: 'O perfil gratuito expira?',
              a: 'Não. Seu perfil é gratuito para sempre.',
            },
            {
              q: 'Preciso pagar para criar o perfil?',
              a: 'Não. O cadastro de atleta é 100% gratuito e não pede nenhuma forma de pagamento.',
            },
            {
              q: 'Como funciona o card de avaliação?',
              a: 'Você compra um card por R$ 9,90 via Pix. Com ele, você pode ser avaliado por um treinador — você convida o treinador pelo ID dele, ou ele te chama pelo seu ID. Após a avaliação, seus atributos ficam visíveis no perfil.',
            },
            {
              q: 'Posso comprar mais de um card?',
              a: 'Sim. Você pode comprar até 2 cards por mês, cada um dando direito a 1 avaliação.',
            },
            {
              q: 'O scout precisa pagar para ver os perfis?',
              a: 'Não. Scouts e visitantes acessam todos os perfis públicos gratuitamente, sem cadastro.',
            },
          ].map(item => (
            <div key={item.q} style={{
              padding: '16px 20px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: 800 }}>{item.q}</p>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{item.a}</p>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
