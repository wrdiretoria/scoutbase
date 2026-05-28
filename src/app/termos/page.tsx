import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso | Meu Craque',
  description: 'Termos de uso e política de privacidade da plataforma Meu Craque.',
}

const UPDATED = '17 de maio de 2025'

export default function TermosPage() {
  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
    }}>
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
          Criar perfil grátis
        </Link>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Legal
          </p>
          <h1 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Termos de Uso
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            Última atualização: {UPDATED}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          <Section title="1. Sobre a plataforma">
            O Meu Craque é uma plataforma digital que permite a atletas de futebol criarem
            perfis públicos, receberem avaliações de treinadores e serem
            descobertos por scouts, clubes e entusiastas do futebol. O acesso básico é
            gratuito para atletas.
          </Section>

          <Section title="2. Cadastro e conta">
            Ao se cadastrar, você declara que todas as informações fornecidas são verdadeiras.
            Você é responsável por manter seu ID de atleta e senha em sigilo. Em caso de
            uso indevido da conta, entre em contato conosco imediatamente. Menores de 18 anos
            devem ter autorização de um responsável legal para criar um perfil.
          </Section>

          <Section title="3. Conteúdo do usuário">
            Ao enviar fotos, vídeos ou informações para a plataforma, você nos concede
            licença para exibir esse conteúdo publicamente. Você declara ter os direitos
            sobre o material enviado. É proibido enviar conteúdo ofensivo, falso ou que
            viole direitos de terceiros.
          </Section>

          <Section title="4. Avaliações">
            As avaliações são realizadas por treinadores cadastrados na plataforma. O Meu
            Craque não garante que as avaliações refletem capacidade profissional definitiva.
            As notas e atributos são ferramentas de desenvolvimento, não diagnósticos absolutos.
          </Section>

          <Section title="5. Privacidade">
            Coletamos dados necessários para o funcionamento da plataforma (nome, cidade,
            posição, data de nascimento, foto). Não vendemos seus dados a terceiros.
            O perfil público do atleta é acessível a qualquer visitante da plataforma —
            isso faz parte do propósito de ser descoberto. Você pode solicitar a exclusão
            da sua conta a qualquer momento pelo e-mail abaixo.
          </Section>

          <Section title="6. Pagamentos">
            Recursos premium (destaque no ranking, carta de avaliação) são cobrados via
            gateway seguro (Asaas). O Meu Craque não armazena dados de cartão de crédito.
            Reembolsos são analisados caso a caso em até 7 dias corridos após a compra.
          </Section>

          <Section title="7. Limitação de responsabilidade">
            O Meu Craque é uma plataforma de conexão e não se responsabiliza por negociações,
            contratos ou acordos realizados entre atletas, treinadores e clubes fora da
            plataforma. O serviço é fornecido "como está", sem garantia de disponibilidade
            ininterrupta.
          </Section>

          <Section title="8. Alterações nos termos">
            Podemos atualizar estes termos a qualquer momento. Usuários serão notificados
            por e-mail quando houver mudanças relevantes. O uso continuado da plataforma
            após as alterações constitui aceite dos novos termos.
          </Section>

          <Section title="9. Contato">
            Dúvidas, solicitações de exclusão de dados ou denúncias de conteúdo impróprio:{' '}
            <a href="mailto:contato@meucraque.com.br" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>
              contato@meucraque.com.br
            </a>
          </Section>

        </div>

        {/* CTA */}
        <div style={{
          marginTop: '48px', padding: '24px', borderRadius: '20px', textAlign: 'center',
          background: 'linear-gradient(135deg,#052e16,#0b1610)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>
            Tudo certo? Crie seu perfil gratuitamente.
          </p>
          <Link href="/atleta/cadastro" style={{
            display: 'inline-block', padding: '13px 28px', borderRadius: '14px',
            background: '#22c55e', color: 'black', fontWeight: 800,
            fontSize: '15px', textDecoration: 'none',
          }}>
            ⚽ Criar meu perfil →
          </Link>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ margin: '0 0 10px', fontSize: '16px', fontWeight: 800, color: 'white' }}>
        {title}
      </h2>
      <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>
        {children}
      </p>
    </div>
  )
}
