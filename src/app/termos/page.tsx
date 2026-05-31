import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso e Política de Privacidade | MEUCRAQUE.com',
  description: 'Termos de uso, política de privacidade e direitos LGPD da plataforma MEUCRAQUE.com.',
}

const VIGENCIA = '01 de junho de 2025'

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ num, title }: { num: string; title: string }) {
  return (
    <h2 style={{
      margin: '0 0 12px',
      fontSize: '15px',
      fontWeight: 800,
      color: '#22c55e',
      letterSpacing: '0.01em',
    }}>
      {num}. {title}
    </h2>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      margin: '20px 0 8px',
      fontSize: '13px',
      fontWeight: 700,
      color: 'rgba(255,255,255,0.7)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    }}>
      {children}
    </h3>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 10px',
      fontSize: '14px',
      color: 'rgba(255,255,255,0.55)',
      lineHeight: 1.85,
    }}>
      {children}
    </p>
  )
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '8px 0 12px', paddingLeft: '20px', listStyle: 'none' }}>
      {items.map((item, i) => (
        <li key={i} style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.52)',
          lineHeight: 1.8,
          paddingLeft: '8px',
          position: 'relative',
        }}>
          <span style={{ position: 'absolute', left: '-12px', color: '#22c55e' }}>·</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Divider() {
  return <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '32px 0' }} />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TermosPage() {
  return (
    <main style={{
      background: '#06100a',
      minHeight: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white',
    }}>

      {/* ── Nav ── */}
      <nav style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        background: 'rgba(6,16,10,0.96)',
        backdropFilter: 'blur(20px)',
        zIndex: 10,
      }}>
        <Link href="/" style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.35)',
          textDecoration: 'none',
          fontWeight: 600,
        }}>
          ← Voltar
        </Link>

        <Link href="/" style={{ fontWeight: 800, textDecoration: 'none', fontSize: '16px' }}>
          <span style={{ marginRight: '4px' }}>⚽</span>
          <span style={{ color: '#00ff87' }}>MEUCRAQUE</span>
          <span style={{ color: 'white' }}>.com</span>
        </Link>

        <div style={{ width: '60px' }} />
      </nav>

      {/* ── Content ── */}
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '48px 24px 100px' }}>

        {/* Title block */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <p style={{
            margin: '0 0 12px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#22c55e',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            Legal
          </p>
          <h1 style={{
            margin: '0 0 12px',
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}>
            Termos de Uso e Política de Privacidade
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            Versão 1.0 — Vigente a partir de {VIGENCIA}
          </p>
        </div>

        {/* ── Seção 1 ── */}
        <SectionHeading num="1" title="Quem Somos" />
        <Body>
          O <strong style={{ color: 'rgba(255,255,255,0.8)' }}>MEUCRAQUE.com</strong> é uma plataforma digital brasileira voltada ao futebol de base, que permite a atletas criarem perfis públicos, receberem avaliações técnicas de treinadores cadastrados e serem descobertos por scouts e clubes. A plataforma é desenvolvida e operada por seus fundadores, com sede no Brasil, e sujeita à legislação brasileira.
        </Body>
        <Body>
          O serviço é destinado exclusivamente a atletas com menos de 18 anos de idade (futebol de base). Treinadores e scouts podem ter acesso com restrições específicas ao seu perfil.
        </Body>

        <Divider />

        {/* ── Seção 2 ── */}
        <SectionHeading num="2" title="Aceitação dos Termos" />
        <Body>
          Ao criar uma conta ou utilizar qualquer funcionalidade da plataforma, o usuário — ou seu responsável legal — declara ter lido, compreendido e concordado integralmente com estes Termos de Uso e com a Política de Privacidade aqui descrita.
        </Body>
        <Body>
          Caso não concorde com qualquer disposição deste documento, o usuário não deve criar um perfil nem utilizar a plataforma.
        </Body>
        <Body>
          O aceite é registrado eletronicamente no momento do cadastro, com data, hora e endereço IP, para fins de comprovação legal.
        </Body>

        <Divider />

        {/* ── Seção 3 ── */}
        <SectionHeading num="3" title="Cadastro de Menores de Idade" />

        <SubHeading>3.1 Responsabilidade do responsável legal</SubHeading>
        <Body>
          Como a plataforma é direcionada a atletas menores de 18 anos, o cadastro deve ser realizado pelo responsável legal (pai, mãe ou tutor). Ao marcar o checkbox de consentimento e concluir o cadastro, o responsável legal declara expressamente:
        </Body>
        <Ul items={[
          'Ter autoridade legal para representar o atleta menor de idade;',
          'Autorizar a criação do perfil público com nome, foto, cidade, posição e data de nascimento do atleta;',
          'Autorizar o uso das imagens enviadas para exibição na plataforma;',
          'Concordar com o tratamento dos dados do atleta conforme esta política;',
          'Ser o único responsável pela veracidade das informações cadastradas.',
        ]} />

        <SubHeading>3.2 Consentimento e retirada</SubHeading>
        <Body>
          O consentimento pode ser retirado a qualquer momento mediante solicitação por e-mail. A retirada do consentimento implica na exclusão do perfil do atleta e de todos os dados associados, no prazo de até 15 dias úteis, ressalvados os dados que precisem ser retidos por obrigação legal.
        </Body>

        <Divider />

        {/* ── Seção 4 ── */}
        <SectionHeading num="4" title="Dados Coletados e Finalidade" />

        <SubHeading>4.1 Dados coletados no cadastro</SubHeading>
        <Ul items={[
          'Nome completo do atleta;',
          'Data de nascimento;',
          'Cidade e estado;',
          'Posição preferida no futebol;',
          'Foto de perfil e galeria de imagens (opcional);',
          'E-mail de recuperação do responsável legal;',
          'Senha (armazenada com hash seguro — nunca em texto puro).',
        ]} />

        <SubHeading>4.2 Dados coletados automaticamente</SubHeading>
        <Ul items={[
          'Endereço IP na criação da conta e no aceite dos termos;',
          'User-agent do navegador ou dispositivo;',
          'Data e hora de acessos e ações relevantes;',
          'Número de visitas ao perfil público (agregado, sem identificar visitantes).',
        ]} />

        <SubHeading>4.3 Finalidade do tratamento</SubHeading>
        <Body>
          Os dados são tratados exclusivamente para:
        </Body>
        <Ul items={[
          'Exibir o perfil público do atleta na plataforma;',
          'Calcular métricas de desempenho e OVR com base em avaliações de treinadores;',
          'Permitir que scouts e treinadores encontrem e avaliem atletas;',
          'Enviar notificações relacionadas à conta (recuperação de acesso, atualizações importantes);',
          'Cumprir obrigações legais, incluindo a LGPD (Lei 13.709/2018).',
        ]} />

        <Divider />

        {/* ── Seção 5 ── */}
        <SectionHeading num="5" title="Compartilhamento de Dados" />
        <Body>
          O MEUCRAQUE.com <strong style={{ color: 'rgba(255,255,255,0.8)' }}>não vende dados pessoais</strong> a terceiros. O compartilhamento ocorre apenas nas seguintes situações:
        </Body>
        <Ul items={[
          'Com treinadores e scouts cadastrados na plataforma, que acessam o perfil público do atleta (conforme a finalidade da plataforma);',
          'Com provedores de infraestrutura tecnológica (Supabase/PostgreSQL para banco de dados, Vercel para hospedagem, Asaas para pagamentos), que operam como operadores de dados e estão sujeitos a acordos de confidencialidade;',
          'Com autoridades competentes, quando exigido por determinação judicial ou legal;',
          'Com o próprio responsável legal, mediante verificação de identidade.',
        ]} />

        <Divider />

        {/* ── Seção 6 ── */}
        <SectionHeading num="6" title="Direitos dos Titulares (LGPD)" />
        <Body>
          Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), o titular dos dados — ou seu responsável legal — tem direito a:
        </Body>
        <Ul items={[
          'Confirmação da existência de tratamento de seus dados;',
          'Acesso aos dados pessoais armazenados;',
          'Correção de dados incompletos, inexatos ou desatualizados;',
          'Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a lei;',
          'Portabilidade dos dados a outro fornecedor de serviço;',
          'Eliminação dos dados tratados com base no consentimento;',
          'Revogação do consentimento a qualquer momento;',
          'Informação sobre com quem os dados foram compartilhados.',
        ]} />
        <Body>
          Para exercer qualquer desses direitos, envie solicitação para:{' '}
          <a href="mailto:privacidade@meucraque.com" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>
            privacidade@meucraque.com
          </a>
          . Responderemos em até 15 dias úteis.
        </Body>

        <Divider />

        {/* ── Seção 7 ── */}
        <SectionHeading num="7" title="Retenção e Exclusão de Dados" />
        <Body>
          Os dados pessoais são retidos enquanto a conta estiver ativa. Após a solicitação de exclusão ou revogação do consentimento:
        </Body>
        <Ul items={[
          'O perfil público é removido imediatamente;',
          'Os dados de cadastro são eliminados em até 15 dias úteis;',
          'Os logs de aceite de termos (IP, data, hora) podem ser retidos por até 5 anos, exclusivamente para fins de comprovação legal;',
          'Dados anonimizados (sem vínculo com o titular) podem ser mantidos para fins estatísticos.',
        ]} />

        <Divider />

        {/* ── Seção 8 ── */}
        <SectionHeading num="8" title="Responsabilidades do Usuário" />
        <Body>
          Ao utilizar a plataforma, o responsável legal se compromete a:
        </Body>
        <Ul items={[
          'Fornecer informações verdadeiras e atualizadas sobre o atleta;',
          'Não criar perfis falsos ou de terceiros sem autorização;',
          'Enviar apenas fotos e vídeos dos quais detém os direitos de imagem;',
          'Não utilizar a plataforma para fins ilícitos, difamatórios ou contrários à boa-fé;',
          'Manter o ID de atleta e a senha em sigilo, sendo responsável por acessos realizados com suas credenciais;',
          'Notificar imediatamente sobre uso não autorizado da conta.',
        ]} />
        <Body>
          É estritamente proibido o envio de conteúdo que exponha menores de idade de forma inadequada, imprópria ou que viole o Estatuto da Criança e do Adolescente (Lei 8.069/1990).
        </Body>

        <Divider />

        {/* ── Seção 9 ── */}
        <SectionHeading num="9" title="Limitação de Responsabilidade" />
        <Body>
          O MEUCRAQUE.com é uma plataforma de conexão e visibilidade. Não nos responsabilizamos por:
        </Body>
        <Ul items={[
          'Negociações, contratos ou acordos realizados entre atletas, treinadores, scouts e clubes fora da plataforma;',
          'A veracidade das avaliações realizadas por treinadores;',
          'Decisões tomadas por clubes ou scouts com base nos perfis exibidos;',
          'Interrupções temporárias do serviço por manutenção, falhas técnicas ou eventos fora de nosso controle;',
          'Conteúdo publicado por usuários que viole direitos de terceiros.',
        ]} />
        <Body>
          O serviço é fornecido "no estado em que se encontra" (as is), sem garantia de disponibilidade ininterrupta ou de resultados esportivos específicos.
        </Body>

        <Divider />

        {/* ── Seção 10 ── */}
        <SectionHeading num="10" title="Propriedade Intelectual" />
        <Body>
          Todo o conteúdo da plataforma — incluindo marca, logotipo, design, código, textos, gráficos e o conceito de "card de atleta" — é propriedade exclusiva do MEUCRAQUE.com e protegido pela legislação de propriedade intelectual brasileira.
        </Body>
        <Body>
          O usuário mantém os direitos sobre as fotos e vídeos que enviar. Ao enviá-los, concede ao MEUCRAQUE.com licença não exclusiva, gratuita e global para exibir esse conteúdo na plataforma enquanto o perfil estiver ativo.
        </Body>
        <Body>
          É vedada a reprodução, cópia ou distribuição do conteúdo da plataforma sem autorização prévia por escrito.
        </Body>

        <Divider />

        {/* ── Seção 11 ── */}
        <SectionHeading num="11" title="Alterações nestes Termos" />
        <Body>
          Podemos atualizar estes Termos a qualquer momento. Sempre que houver alterações relevantes:
        </Body>
        <Ul items={[
          'A versão e a data de vigência serão atualizadas nesta página;',
          'Os usuários cadastrados serão notificados pelo e-mail de recuperação informado no cadastro;',
          'O uso continuado da plataforma após a notificação constitui aceite automático dos novos termos.',
        ]} />
        <Body>
          Caso não concorde com as alterações, o usuário poderá solicitar a exclusão de sua conta antes que os novos termos entrem em vigor.
        </Body>

        <Divider />

        {/* ── Seção 12 ── */}
        <SectionHeading num="12" title="Lei Aplicável e Foro" />
        <Body>
          Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial pela Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018), pelo Estatuto da Criança e do Adolescente (ECA — Lei 8.069/1990) e pelo Marco Civil da Internet (Lei 12.965/2014).
        </Body>
        <Body>
          Para a resolução de qualquer controvérsia decorrente destes Termos, fica eleito o foro da comarca de São Paulo — SP, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
        </Body>
        <Body>
          Dúvidas, solicitações de exclusão de dados ou denúncias de conteúdo impróprio:{' '}
          <a href="mailto:privacidade@meucraque.com" style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 700 }}>
            privacidade@meucraque.com
          </a>
        </Body>

        {/* ── Footer ── */}
        <div style={{
          marginTop: '56px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
            Última atualização: {VIGENCIA} —{' '}
            <span style={{ color: '#22c55e' }}>meucraque.com</span>
          </p>
        </div>

      </div>
    </main>
  )
}
