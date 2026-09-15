import Link from 'next/link'
import type { Metadata } from 'next'
import PixCheckoutButton from '@/components/PixCheckoutButton'

export const metadata: Metadata = {
  title: 'Planos | Meu Craque',
  description: 'Perfil gratuito, avaliação avulsa por R$ 9,90 e os planos Pro — Atleta, Treinador/Scout e Clube institucional.',
}

const FEATURE = { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' } as const

function PlanCard({
  eyebrow, preco, periodo, subtitulo, features, cta, destaque,
}: {
  eyebrow: string
  preco: string
  periodo?: string
  subtitulo: string
  features: string[]
  cta: React.ReactNode
  destaque?: boolean
}) {
  return (
    <div className="plan-card" style={{
      padding: '28px', borderRadius: '20px',
      background: destaque ? 'linear-gradient(135deg,#052e16,#0b1a10)' : 'rgba(255,255,255,0.03)',
      border: destaque ? '2px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.08)',
      position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {destaque && (
        <div style={{
          position: 'absolute', top: '-40px', left: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(34,197,94,0.12),transparent 70%)',
          pointerEvents: 'none',
        }} />
      )}
      <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: destaque ? '#22c55e' : 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {eyebrow}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
        <p style={{ margin: 0, fontSize: '28px', fontWeight: 900 }}>{preco}</p>
        {periodo && <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{periodo}</span>}
      </div>
      <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>{subtitulo}</p>

      <div style={{ marginBottom: '24px', flex: 1 }}>
        {features.map(f => (
          <div key={f} style={FEATURE}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>

      {cta}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 16px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      {children}
    </p>
  )
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
          ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
        </Link>
        <Link href="/atleta/cadastro" style={{
          padding: '8px 16px', borderRadius: '10px', background: '#22c55e',
          color: 'black', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
        }}>
          Começar grátis
        </Link>
      </nav>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Simples assim
          </p>
          <h1 style={{ margin: '0 0 12px', fontSize: '36px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Perfil gratuito.<br />
            <span style={{ color: '#22c55e' }}>Cresça no seu ritmo.</span>
          </h1>
          <p style={{ margin: '0 auto', fontSize: '16px', color: 'rgba(255,255,255,0.45)', maxWidth: '540px', lineHeight: 1.6 }}>
            Crie seu perfil de graça, compre uma avaliação avulsa quando quiser ser avaliado por um treinador,
            e assine um plano Pro quando fizer sentido pra você.
          </p>
        </div>

        {/* ══ Atleta: perfil gratuito + avaliação avulsa ══ */}
        <SectionLabel>Atleta — avaliação avulsa</SectionLabel>
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

        {/* ══ Planos Pro mensais ══ */}
        <SectionLabel>Planos Pro</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>

          <PlanCard
            eyebrow="Atleta Pro"
            preco="R$ 19,90"
            periodo="/mês"
            subtitulo="Pra quem quer ser encontrado por quem importa."
            features={[
              '👁  Veja quem visualizou seu perfil',
              '🎬  Vídeos ilimitados no perfil',
              '⭐  Destaque no ranking e na busca',
              '📄  Currículo em PDF pra enviar a clubes',
              '✅  Selo "Perfil Verificado"',
            ]}
            cta={<PixCheckoutButton produto="atleta_pro" label="Assinar Atleta Pro" corPrimaria="#22c55e" />}
          />

          <PlanCard
            eyebrow="Treinador / Scout Pro"
            preco="R$ 49,90"
            periodo="/mês"
            subtitulo="5 buscas grátis por mês. Sem selo verificado."
            destaque
            features={[
              '🔍  Busca ilimitada com filtros avançados',
              '✉️  Mensagens diretas ilimitadas',
              '📋  Shortlists e comparação de atletas',
              '🔔  Alerta de novo talento por filtro salvo',
              '✅  Selo "Scout Verificado"',
            ]}
            cta={<PixCheckoutButton produto="treinador_pro" label="Assinar Treinador/Scout Pro" corPrimaria="#22c55e" />}
          />

          <PlanCard
            eyebrow="Clube / Escolinha institucional"
            preco="R$ 149,90"
            periodo="/mês"
            subtitulo="Pra escolinhas e clubes com captação ativa."
            features={[
              '🏟  Página verificada da instituição',
              '💼  Peneiras e vagas ilimitadas',
              '🗂  Banco de talentos filtrado',
              '📊  Painel de candidatos por vaga',
            ]}
            cta={<PixCheckoutButton produto="clube" label="Assinar plano institucional" corPrimaria="#22c55e" />}
          />

        </div>

        {/* Add-on avulso */}
        <div style={{
          padding: '24px 28px', borderRadius: '20px', marginBottom: '48px',
          background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.25)',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', justifyContent: 'space-between',
        }}>
          <div style={{ flex: '1 1 320px' }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ⚡ Add-on avulso — sem assinatura
            </p>
            <p style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 900 }}>
              Impulsionar perfil — <span style={{ color: '#fbbf24' }}>R$ 9,90</span>
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
              7 dias de destaque no topo do ranking e da busca de scouts. Pagamento único, não precisa assinar nada.
            </p>
          </div>
          <div style={{ flex: '0 1 260px', minWidth: '220px' }}>
            <PixCheckoutButton produto="boost" label="Impulsionar meu perfil" corPrimaria="#fbbf24" />
          </div>
        </div>

        {/* FAQ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800 }}>Dúvidas rápidas</p>

          {[
            {
              q: 'O perfil gratuito expira?',
              a: 'Não. Seu perfil é gratuito para sempre — os planos Pro só destravam recursos extras de visibilidade e gestão.',
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
              q: 'Os planos Pro são assinaturas recorrentes?',
              a: 'Cada pagamento Pix libera 30 dias de acesso Pro (ou 7 dias no caso do Impulsionar perfil). Perto do vencimento, é só gerar uma nova cobrança pela mesma página pra renovar.',
            },
            {
              q: 'Um treinador e um scout pagam o mesmo plano Pro?',
              a: 'Sim, o Treinador/Scout Pro tem o mesmo preço e benefícios pros dois tipos de conta — cada um recebe o Pro na sua própria conta.',
            },
            {
              q: 'Quem pode assinar o plano institucional?',
              a: 'Qualquer conta de treinador ou escolinha — não existe um tipo de conta "clube" separado, a página do clube e as vagas ficam vinculadas à sua própria conta de treinador.',
            },
            {
              q: 'Scouts sem plano Pro conseguem buscar atletas?',
              a: 'Sim, com um limite de 5 buscas por mês. Passado esse limite, é só assinar o Pro pra continuar buscando sem restrição.',
            },
            {
              q: 'O scout precisa pagar para ver os perfis?',
              a: 'Não. Scouts e visitantes acessam todos os perfis públicos gratuitamente, sem cadastro — o plano Pro só destrava busca ilimitada, mensagens e outros recursos extras.',
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
