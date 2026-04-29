import Link from 'next/link'

/* ─── dados estáticos ─── */
const stats = [
  { value: '2.4K+', label: 'Atletas cadastrados' },
  { value: '380+', label: 'Treinadores ativos' },
  { value: '97%', label: 'Satisfação' },
  { value: '12+', label: 'Estados' },
]

const audiences = [
  {
    icon: '🏆',
    title: 'Treinadores',
    description: 'Tenha controle total da sua equipe em um só lugar.',
    benefits: ['Cadastro e gestão de alunos', 'Controle de presença por turma', 'Avaliações com Scout Score', 'Relatórios em PDF'],
    highlight: false,
  },
  {
    icon: '⚽',
    title: 'Atletas',
    description: 'Acompanhe sua evolução técnica, física e tática.',
    benefits: ['Scout Score atualizado', 'Histórico de avaliações', 'Gráfico de desempenho', 'Feedback do treinador'],
    highlight: false,
  },
  {
    icon: '👨‍👩‍👦',
    title: 'Responsáveis e Família',
    description: 'Fique por dentro do desenvolvimento do seu filho.',
    benefits: ['Link exclusivo sem login', 'Frequência em tempo real', 'Radar de habilidades', 'Comunicação direta'],
    highlight: false,
  },
  {
    icon: '👑',
    title: 'CEO / Dono da Equipe',
    description: 'Visão 360° de toda a operação — do financeiro aos atletas.',
    benefits: ['Painel executivo do gestor', 'Visão geral de treinadores e atletas', 'Relatórios financeiros e operacionais', 'Indicadores estratégicos em tempo real'],
    highlight: true,
  },
]

const features = [
  { icon: '📋', title: 'Gestão de Turmas', desc: 'Crie turmas por categoria (Sub-11, Sub-13…) e organize todos os alunos.' },
  { icon: '✅', title: 'Controle de Presença', desc: 'Marque presença com um clique. Visualize frequência e alertas de risco.' },
  { icon: '📊', title: 'Avaliações Completas', desc: 'Avalie 4 pilares: Técnico, Físico, Tático e Comportamento.' },
  { icon: '📄', title: 'Relatório em PDF', desc: 'Gere relatórios profissionais para compartilhar com responsáveis.' },
]

const steps = [
  { num: '01', title: 'Crie sua conta', desc: 'Cadastro gratuito em menos de 1 minuto.' },
  { num: '02', title: 'Monte suas turmas', desc: 'Adicione alunos e organize por categoria.' },
  { num: '03', title: 'Registre e avalie', desc: 'Controle presenças e faça avaliações.' },
  { num: '04', title: 'Acompanhe resultados', desc: 'Dados em tempo real para tomar decisões.' },
]

const testimonials = [
  {
    quote: 'Antes anotava tudo no caderno. Hoje os pais recebem relatório pelo WhatsApp. Profissionalizou demais meu trabalho.',
    name: 'Roberto Carvalho',
    role: 'Treinador de Base',
    city: 'Rio de Janeiro, RJ',
  },
  {
    quote: 'Os pais confiam mais no meu trabalho porque veem tudo em tempo real. Isso fidelizou minha escolinha.',
    name: 'Rafael Mendes',
    role: 'Treinador',
    city: 'São Paulo, SP',
  },
  {
    quote: 'Consigo mostrar evolução com dados. Isso é o que diferencia um professor sério.',
    name: 'Bruno Lima',
    role: 'Coordenador Técnico',
    city: 'Belo Horizonte, BH',
  },
]

const dores = [
  'Alunos e dados espalhados no caderno e grupo do WhatsApp',
  'Pais cobrando resultados que você não consegue mostrar',
  'Alunos saindo sem você saber o motivo',
  'Falta de organização que faz você parecer menos profissional',
  'Dificuldade de acompanhar a evolução de cada aluno',
]

export default function LandingPage() {
  return (
    <div className="bg-[#09110d] text-white min-h-screen">

      {/* ─── NAV ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#09110d]/90 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-[family-name:var(--font-bebas)] text-2xl text-green-500 tracking-wide">
            ScoutBase
          </span>
          <Link
            href="/login"
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Entrar →
          </Link>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-[family-name:var(--font-bebas)] leading-[1.05] tracking-wide">
            <span className="block text-[clamp(2rem,6vw,4.5rem)] text-white leading-tight">ONDE O FUTEBOL DE BASE</span>
            <span className="block text-[clamp(2rem,6vw,4.5rem)] text-green-500 leading-tight">SE CONECTA E ENTREGA</span>
            <span className="block text-[clamp(2rem,6vw,4.5rem)] text-white leading-tight">RESULTADOS</span>
          </h1>
          <p className="mt-7 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Avalie atletas, mostre evolução com relatórios de IA e transforme sua escolinha em uma estrutura de nível profissional.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cadastro"
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-base transition-colors"
            >
              Começar Agora — é grátis
            </Link>
            <a
              href="#como-funciona"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl text-base transition-colors"
            >
              Ver como funciona
            </a>
          </div>
        </div>
      </section>

      {/* ─── DORES ─── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-[family-name:var(--font-bebas)] text-3xl sm:text-4xl text-center tracking-wide mb-3">
            VOCÊ SE IDENTIFICA COM ISSO?
          </h2>
          <p className="text-center text-gray-500 text-sm mb-10">
            Se sim, o ScoutBase foi feito pra você.
          </p>
          <div className="space-y-3">
            {dores.map((dor) => (
              <div
                key={dor}
                className="flex items-start gap-4 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-5 py-4"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/15 flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </span>
                <p className="text-gray-300 text-sm sm:text-base leading-snug">{dor}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Resolver isso agora →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-[family-name:var(--font-bebas)] text-4xl text-green-500 tracking-wide">
                {s.value}
              </p>
              <p className="text-sm text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PARA QUEM É ─── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-[family-name:var(--font-bebas)] text-4xl sm:text-5xl text-center tracking-wide mb-14">
            PARA QUEM É O SCOUTBASE?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((a) => (
              <div
                key={a.title}
                className={`relative rounded-2xl p-6 transition-colors ${
                  a.highlight
                    ? 'bg-amber-950/40 border border-amber-500/50 hover:border-amber-400'
                    : 'bg-white/5 border border-white/10 hover:border-green-500/40'
                }`}
              >
                {a.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                    Painel do Gestor
                  </span>
                )}
                <div className="text-3xl mb-3">{a.icon}</div>
                <h3 className={`text-lg font-bold mb-2 ${a.highlight ? 'text-amber-400' : 'text-white'}`}>
                  {a.title}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{a.description}</p>
                <ul className="space-y-2">
                  {a.benefits.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-gray-300">
                      <span className={a.highlight ? 'text-amber-400' : 'text-green-500'}>✓</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* lista */}
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-4xl sm:text-5xl tracking-wide mb-10">
              TUDO QUE SUA EQUIPE PRECISA
            </h2>
            <div className="space-y-6">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="text-2xl mt-0.5">{f.icon}</div>
                  <div>
                    <p className="font-semibold text-white">{f.title}</p>
                    <p className="text-sm text-gray-400 mt-1">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* mockup */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <p className="text-xs text-gray-500 mb-4 uppercase tracking-widest">Perfil do atleta</p>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center font-bold text-lg">
                G
              </div>
              <div>
                <p className="font-semibold text-white">Gabriel Silva</p>
                <p className="text-xs text-gray-400">Sub-15 · Meia</p>
              </div>
              <span className="ml-auto text-2xl font-[family-name:var(--font-bebas)] text-green-500 tracking-wide">
                8.4
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Técnico', '9.0'], ['Físico', '8.0'], ['Tático', '8.5'], ['Comportamento', '8.2']].map(([label, val]) => (
                <div key={label} className="bg-white/5 rounded-lg px-3 py-2">
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="text-white font-semibold">{val}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
              <span className="text-gray-400">Frequência</span>
              <span className="text-green-400 font-semibold">91%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ─── */}
      <section id="como-funciona" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-[family-name:var(--font-bebas)] text-4xl sm:text-5xl text-center tracking-wide mb-14">
            COMO FUNCIONA
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <p className="font-[family-name:var(--font-bebas)] text-5xl text-green-500/30 tracking-wide">
                  {s.num}
                </p>
                <p className="font-semibold text-white mt-2">{s.title}</p>
                <p className="text-sm text-gray-400 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DEPOIMENTOS ─── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-[family-name:var(--font-bebas)] text-4xl sm:text-5xl text-center tracking-wide mb-14">
            O QUE DIZEM OS TREINADORES
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col"
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-5 pt-4 border-t border-white/10">
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.role}</p>
                  <p className="text-xs text-green-600 mt-0.5">{t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLANOS ─── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-[family-name:var(--font-bebas)] text-4xl sm:text-5xl text-center tracking-wide mb-4">
            PLANOS E PREÇOS
          </h2>
          <p className="text-center text-gray-400 text-sm mb-4">
            Responsáveis sempre acessam grátis. Boletim completo disponível quando o treinador tem plano pago.
          </p>
          <p className="text-center text-gray-500 text-xs mb-14">
            Sem taxa de setup. Cancele quando quiser.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">

            {/* Grátis */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Grátis</p>
              <p className="font-[family-name:var(--font-bebas)] text-5xl text-white tracking-wide">R$0</p>
              <p className="text-xs text-gray-500 mt-1 mb-6">para sempre</p>
              <ul className="space-y-3 flex-1">
                {[
                  'Cadastro de atletas',
                  'Lista de presença',
                  'Responsáveis acompanham frequência do filho',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-500 mt-0.5">✓</span> {item}
                  </li>
                ))}
                {[
                  'Sem Scout Score',
                  'Sem relatórios avançados',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-0.5">✗</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="mt-8 block text-center py-2.5 rounded-xl text-sm font-semibold border border-white/20 hover:border-white/40 text-white transition-colors"
              >
                Começar grátis
              </Link>
            </div>

            {/* Treinador */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Treinador</p>
              <div className="flex items-end gap-1">
                <p className="font-[family-name:var(--font-bebas)] text-5xl text-white tracking-wide">R$47</p>
                <p className="text-gray-500 text-sm mb-1.5">/mês</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 mb-6">1 treinador · até 30 atletas</p>
              <ul className="space-y-3 flex-1">
                {[
                  'Avaliações e presenças',
                  'Scout Score completo',
                  'Relatórios básicos e avançados',
                  'Responsáveis acompanham boletim completo',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-500 mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="mt-8 block text-center py-2.5 rounded-xl text-sm font-semibold border border-white/20 hover:border-white/40 text-white transition-colors"
              >
                Assinar
              </Link>
            </div>

            {/* Equipe */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Equipe</p>
              <div className="flex items-end gap-1">
                <p className="font-[family-name:var(--font-bebas)] text-5xl text-white tracking-wide">R$97</p>
                <p className="text-gray-500 text-sm mb-1.5">/mês</p>
              </div>
              <p className="text-xs text-gray-500 mt-1 mb-6">3 treinadores · até 100 atletas</p>
              <ul className="space-y-3 flex-1">
                {[
                  'Tudo do Plano Treinador',
                  '3 treinadores inclusos',
                  'Até 100 atletas',
                  'Painel de gestão da equipe',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-500 mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="mt-8 block text-center py-2.5 rounded-xl text-sm font-semibold border border-white/20 hover:border-white/40 text-white transition-colors"
              >
                Assinar
              </Link>
            </div>

            {/* CEO — destaque */}
            <div className="relative bg-green-950/50 border-2 border-green-500 rounded-2xl p-6 flex flex-col">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide whitespace-nowrap">
                ⭐ Recomendado
              </span>
              <p className="text-xs text-green-400 uppercase tracking-widest mb-3">CEO</p>
              <div className="flex items-end gap-1">
                <p className="font-[family-name:var(--font-bebas)] text-5xl text-green-400 tracking-wide">R$197</p>
                <p className="text-gray-400 text-sm mb-1.5">/mês</p>
              </div>
              <p className="text-xs text-green-600 font-semibold mt-1 mb-1">30 dias grátis</p>
              <p className="text-xs text-gray-500 mb-6">Treinadores e atletas ilimitados</p>
              <ul className="space-y-3 flex-1">
                {[
                  'Até 200 atletas inclusos',
                  'Acima de 200: R$0,99/atleta/mês',
                  'Painel do gestor completo',
                  'Financeiro e inadimplência',
                  'Relatórios executivos',
                  'Suporte prioritário',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-200">
                    <span className="text-green-400 mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="mt-8 block text-center py-2.5 rounded-xl text-sm font-bold bg-green-500 hover:bg-green-400 text-black transition-colors"
              >
                Começar 30 dias grátis
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-[family-name:var(--font-bebas)] text-[clamp(2.5rem,8vw,5.5rem)] leading-none tracking-wide">
            PRONTO PARA PROFISSIONALIZAR SUA EQUIPE?
          </h2>
          <p className="mt-6 text-gray-400 text-lg">
            Comece grátis hoje. Sem cartão de crédito.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/cadastro"
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl text-base transition-colors"
            >
              Criar conta grátis
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl text-base transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-[family-name:var(--font-bebas)] text-xl text-green-500 tracking-wide">
            ScoutBase
          </span>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} ScoutBase. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}
