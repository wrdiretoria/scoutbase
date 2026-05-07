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

const navLinks = ['Recursos', 'Treinadores', 'Atletas', 'Responsáveis', 'Preços', 'Sobre']

const cardBar = [
  { icon: '🏟️', title: 'Para Treinadores', desc: 'Gerencie turmas, presenças e avaliações num só lugar.' },
  { icon: '⚽', title: 'Para Atletas', desc: 'Acompanhe sua evolução com dados reais.' },
  { icon: '👨‍👩‍👦', title: 'Para Responsáveis', desc: 'Veja o progresso do seu filho em tempo real.' },
  { icon: '🔍', title: 'Para Scouts', desc: 'Descubra talentos com relatórios completos.' },
]

export default function LandingPage() {
  return (
    <div className="bg-[#09110d] text-white min-h-screen">

      {/* ─── HERO FULLSCREEN ─── */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Background */}
        <img
          src="https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=1920&q=90"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* ─── NAV FIXA ─── */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between gap-8">
            {/* Logo */}
            <span className="font-[family-name:var(--font-bebas)] text-2xl tracking-widest shrink-0">
              <span className="text-white">MEU </span>
              <span style={{ color: '#22c55e' }}>CRAQUE</span>
            </span>

            {/* Links */}
            <div className="hidden lg:flex items-center gap-6 flex-1 justify-center">
              {navLinks.map((l) => (
                <a key={l} href="#" className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                  {l}
                </a>
              ))}
            </div>

            {/* Botões */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white border border-white/30 hover:border-white/60 rounded-lg transition-colors">
                Entrar
              </Link>
              <Link href="/cadastro" className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors" style={{ backgroundColor: '#16a34a' }}>
                Começar agora
              </Link>
            </div>
          </div>
        </nav>

        {/* ─── GRID HERO ─── */}
        <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-2 h-screen w-full">

          {/* Esquerda — topo-esquerdo */}
          <div
            className="flex flex-col gap-6 self-start"
            style={{ paddingLeft: '80px', paddingTop: '160px' }}
          >
            {/* Badge */}
            <span className="inline-flex items-center gap-2 w-fit px-4 py-1.5 rounded-full text-xs font-semibold text-white border border-green-500/50" style={{ backgroundColor: 'rgba(34,197,94,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Plataforma #1 para futebol de base
            </span>

            {/* H1 */}
            <h1 className="leading-tight" style={{ fontSize: '5rem', fontWeight: 900, letterSpacing: '-0.03em', maxWidth: 'none' }}>
              <span className="block text-white">A jornada completa</span>
              <span className="block text-white">de quem vive</span>
              <span className="block italic" style={{ color: '#22c55e' }}>o futebol.</span>
            </h1>

            {/* Subtítulo */}
            <p className="text-lg text-white/70 leading-relaxed">
              Avalie atletas, mostre evolução com dados e eleve o nível da sua escolinha para um padrão profissional.
            </p>

            {/* Botão */}
            <div>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-3 px-8 py-4 text-white text-base font-bold rounded-2xl transition-all shadow-lg shadow-green-900/40 hover:scale-105"
                style={{ backgroundColor: '#16a34a' }}
              >
                Começar grátis agora
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="text-xs text-white/40 mt-3">Sem cartão de crédito · Configuração em 2 min</p>
            </div>
          </div>

          {/* Direita — phones flutuando */}
          <div className="hidden lg:flex items-center justify-center relative" style={{ width: '500px', height: '600px', margin: 'auto' }}>
            {/* Phone de trás */}
            <div
              className="absolute bg-white rounded-[40px] shadow-2xl overflow-hidden"
              style={{
                width: '240px',
                height: '460px',
                top: '60px',
                right: '20px',
                transform: 'rotate(6deg)',
                opacity: 0.85,
              }}
            >
              <div className="h-8 bg-white flex items-center justify-center">
                <div className="w-16 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <div className="p-4 space-y-3">
                <div className="h-3 bg-green-100 rounded-full w-3/4" />
                <div className="h-2 bg-gray-100 rounded-full w-full" />
                <div className="h-2 bg-gray-100 rounded-full w-2/3" />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {['Técnico','Físico','Tático','Comport.'].map(l => (
                    <div key={l} className="bg-gray-50 rounded-xl p-2">
                      <p className="text-[8px] text-gray-400">{l}</p>
                      <p className="text-xs font-bold text-gray-800">8.5</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 bg-green-50 rounded-xl p-2">
                  <p className="text-[8px] text-gray-400">Frequência</p>
                  <p className="text-xs font-bold text-green-600">91%</p>
                </div>
              </div>
            </div>

            {/* Phone da frente */}
            <div
              className="absolute bg-white rounded-[44px] shadow-2xl overflow-hidden"
              style={{
                width: '288px',
                height: '540px',
                top: '30px',
                left: '20px',
                transform: 'rotate(-4deg)',
              }}
            >
              <div className="h-9 bg-white flex items-center justify-center border-b border-gray-100">
                <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">G</div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Gabriel Silva</p>
                    <p className="text-[10px] text-gray-400">Sub-15 · Meia</p>
                  </div>
                  <span className="ml-auto text-lg font-black text-green-600">84</span>
                </div>
                <div className="bg-green-50 rounded-2xl p-3 text-center">
                  <p className="text-[9px] text-gray-400 mb-1">Scout Score</p>
                  <p className="text-3xl font-black text-green-600">84</p>
                  <p className="text-[9px] text-gray-400">de 100</p>
                </div>
                <div className="space-y-2">
                  {[['📅 Próximo treino','Qui, 08/05 às 09h'],['📍 Local','Campo Principal'],['✅ Frequência','91%']].map(([l,v]) => (
                    <div key={l} className="flex justify-between text-[10px]">
                      <span className="text-gray-500">{l}</span>
                      <span className="font-semibold text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 rounded-2xl overflow-hidden bg-green-600 p-3 text-center">
                  <p className="text-white text-[10px] font-semibold">Mensalidade em dia ✅</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── CARDS BAR ─── */}
        <div className="relative z-10 w-full border-t border-white/10 bg-black/40 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
            {cardBar.map((c) => (
              <div key={c.title} className="flex items-start gap-3 px-6 py-5">
                <span className="text-2xl mt-0.5">{c.icon}</span>
                <div>
                  <p className="text-sm font-bold text-white">{c.title}</p>
                  <p className="text-xs text-white/50 mt-0.5 leading-snug">{c.desc}</p>
                </div>
              </div>
            ))}
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
            PARA QUEM É O Meu Craque?
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

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-[family-name:var(--font-bebas)] text-xl text-green-500 tracking-wide">
            Meu Craque
          </span>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} Meu Craque. Todos os direitos reservados.
          </p>
        </div>
      </footer>

    </div>
  )
}
