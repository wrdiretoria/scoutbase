import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planos | Meu Craque',
  description: 'Conheça os planos do Meu Craque. Perfil gratuito para atletas, recursos premium para se destacar.',
}

export default function PlanosPage() {
  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
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

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Simples assim
          </p>
          <h1 style={{ margin: '0 0 12px', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Grátis pra jogar.<br />
            <span style={{ color: '#22c55e' }}>Premium pra se destacar.</span>
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: 'rgba(255,255,255,0.45)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
            Todo atleta tem perfil gratuito para sempre. Os recursos abaixo aceleram sua visibilidade.
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px', marginBottom: '48px',
        }}>

          {/* Grátis */}
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

          {/* Destaque */}
          <div className="plan-card" style={{
            padding: '28px', borderRadius: '20px',
            background: 'linear-gradient(135deg,#052e16,#0b1a10)',
            border: '2px solid rgba(34,197,94,0.35)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Badge popular */}
            <div style={{
              position: 'absolute', top: '16px', right: '16px',
              padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
              background: '#22c55e', color: 'black', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              🔥 Popular
            </div>

            {/* Orbe decorativo */}
            <div style={{
              position: 'absolute', top: '-40px', left: '-40px',
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'radial-gradient(circle,rgba(34,197,94,0.12),transparent 70%)',
              pointerEvents: 'none',
            }} />

            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Destaque</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>R$ 19,90</p>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>/mês</span>
            </div>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>30 dias no topo da busca dos scouts.</p>

            <div style={{ marginBottom: '24px' }}>
              {[
                '✅  Tudo do plano gratuito',
                '⭐  Aparece primeiro na busca de scouts',
                '⭐  Badge "Em destaque" no perfil',
                '⭐  Prioridade no ranking por categoria',
                '⭐  Notificação quando um scout favoritar',
              ].map(f => (
                <div key={f} className="feat-row">
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/atleta/promover" style={{
              display: 'block', padding: '14px', borderRadius: '12px', textAlign: 'center',
              background: '#22c55e', color: 'black',
              fontWeight: 800, fontSize: '14px', textDecoration: 'none',
            }}>
              Quero me destacar →
            </Link>
          </div>

          {/* Carta */}
          <div className="plan-card" style={{
            padding: '28px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Carta oficial</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
              <p style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>R$ 9,90</p>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>único</span>
            </div>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>Documento oficial da sua avaliação.</p>

            <div style={{ marginBottom: '24px' }}>
              {[
                '✅  Tudo do plano gratuito',
                '📄  Carta de avaliação em PDF',
                '📄  Assinatura digital do treinador',
                '📄  QR Code de verificação',
                '📄  Compartilhável com clubes',
              ].map(f => (
                <div key={f} className="feat-row">
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            <Link href="/atleta/carta" style={{
              display: 'block', padding: '14px', borderRadius: '12px', textAlign: 'center',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 800, fontSize: '14px', textDecoration: 'none',
            }}>
              Quero minha carta →
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
              <p style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900 }}>Plano Escola</p>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                Avalie seus atletas, acompanhe evolução, gere relatórios e aumente a visibilidade da sua escola no ranking.
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

        {/* FAQ curto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Dúvidas rápidas</p>

          {[
            {
              q: 'O perfil gratuito expira?',
              a: 'Não. Seu perfil é gratuito para sempre. Recursos de destaque têm duração de 30 dias e são opcionais.',
            },
            {
              q: 'Preciso de cartão de crédito para criar o perfil?',
              a: 'Não. O cadastro de atleta é 100% gratuito e não pede nenhuma forma de pagamento.',
            },
            {
              q: 'O scout precisa pagar para ver os perfis?',
              a: 'Não. Scouts e visitantes acessam todos os perfis públicos gratuitamente, sem cadastro.',
            },
            {
              q: 'Como funciona o pagamento do Destaque?',
              a: 'Via Pix ou cartão. O destaque é ativado imediatamente após a confirmação do pagamento.',
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
