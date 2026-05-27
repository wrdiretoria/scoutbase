'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const PERGUNTAS = [
  {
    key: 'filosofia',
    pergunta: 'Qual é sua filosofia como treinador?',
    opcoes: [
      { valor: 'desenvolvimento',  label: '🌱 Desenvolvimento',   desc: 'Priorizo o crescimento humano e técnico acima de tudo' },
      { valor: 'resultados',       label: '🏆 Resultados',        desc: 'Gosto de times competitivos e foco em vencer' },
      { valor: 'metodo',           label: '📐 Método',            desc: 'Trabalho com sistemas táticos bem definidos' },
      { valor: 'equilibrio',       label: '⚖ Equilíbrio',        desc: 'Combino formação, resultado e método' },
    ],
  },
  {
    key: 'categoria',
    pergunta: 'Com qual categoria você mais trabalha?',
    opcoes: [
      { valor: 'sub11',     label: 'Sub-11',  desc: 'Iniciação e base do futebol' },
      { valor: 'sub13',     label: 'Sub-13',  desc: 'Desenvolvimento técnico inicial' },
      { valor: 'sub15',     label: 'Sub-15',  desc: 'Fase de transição tática' },
      { valor: 'sub17',     label: 'Sub-17',  desc: 'Formação avançada' },
      { valor: 'sub20',     label: 'Sub-20',  desc: 'Pré-profissional' },
      { valor: 'adulto',    label: 'Adulto',  desc: 'Futebol profissional ou amador adulto' },
    ],
  },
  {
    key: 'especialidade',
    pergunta: 'Qual é sua maior especialidade técnica?',
    opcoes: [
      { valor: 'tatica',     label: '🧩 Tática',              desc: 'Sistemas de jogo e organização coletiva' },
      { valor: 'tecnica',    label: '⚽ Técnica individual',   desc: 'Aprimoramento de habilidades com bola' },
      { valor: 'fisica',     label: '💪 Preparação física',    desc: 'Condicionamento e performance atlética' },
      { valor: 'goleiros',   label: '🧤 Goleiros',             desc: 'Especialista em treinamento de goleiros' },
      { valor: 'mental',     label: '🧠 Psicológico',          desc: 'Foco em mentalidade e concentração' },
    ],
  },
  {
    key: 'anos_experiencia',
    pergunta: 'Há quantos anos você treina atletas?',
    opcoes: [
      { valor: 'menos1',   label: 'Menos de 1 ano',   desc: 'Estou começando minha carreira' },
      { valor: '1a3',      label: '1 a 3 anos',       desc: 'Tenho alguma experiência acumulada' },
      { valor: '3a5',      label: '3 a 5 anos',       desc: 'Já tenho uma trajetória sólida' },
      { valor: '5a10',     label: '5 a 10 anos',      desc: 'Sou um treinador experiente' },
      { valor: 'mais10',   label: 'Mais de 10 anos',  desc: 'Sou veterano na área' },
    ],
  },
  {
    key: 'frequencia_treino',
    pergunta: 'Quantas sessões de treino você conduz por semana?',
    opcoes: [
      { valor: '1a2',    label: '1 a 2 sessões',  desc: 'Trabalho em turno reduzido' },
      { valor: '3a4',    label: '3 a 4 sessões',  desc: 'Ritmo regular de treinos' },
      { valor: '5mais',  label: '5 ou mais',      desc: 'Rotina intensa de trabalho' },
      { valor: 'varia',  label: 'Varia bastante', desc: 'Depende da temporada' },
    ],
  },
  {
    key: 'certificacao',
    pergunta: 'Você possui certificação formal em futebol?',
    opcoes: [
      { valor: 'cbf_c',      label: 'Licença C CBF',            desc: 'Tenho a licença de base da CBF' },
      { valor: 'cbf_b',      label: 'Licença B CBF ou superior', desc: 'Tenho licença avançada da CBF' },
      { valor: 'curso',      label: 'Cursos reconhecidos',       desc: 'Fiz cursos de futebol certificados' },
      { valor: 'andamento',  label: 'Em andamento',              desc: 'Estou me certificando agora' },
      { valor: 'nao',        label: 'Ainda não',                 desc: 'Aprendi na prática, ainda sem certificação formal' },
    ],
  },
  {
    key: 'talento',
    pergunta: 'Como você identifica o potencial de um atleta?',
    opcoes: [
      { valor: 'tecnica',      label: '⚽ Técnica em campo',     desc: 'Analiso qualidade com bola e fundamentos' },
      { valor: 'comportamento',label: '🦁 Comportamento',        desc: 'Observo atitude, disciplina e garra' },
      { valor: 'fisico',       label: '💪 Físico e atletismo',   desc: 'Velocidade, força e estrutura corporal' },
      { valor: 'intuitivo',    label: '🎯 Instinto de treinador', desc: 'Sinto o potencial no olhar e na postura' },
    ],
  },
  {
    key: 'valor_desenvolvimento',
    pergunta: 'O que você mais valoriza no desenvolvimento de um jovem?',
    opcoes: [
      { valor: 'disciplina',  label: '🔒 Disciplina',     desc: 'Respeito, compromisso e pontualidade' },
      { valor: 'tecnica',     label: '⚽ Técnica',         desc: 'Domínio de bola e habilidade individual' },
      { valor: 'mentalidade', label: '🧠 Mentalidade',    desc: 'Resiliência, foco e vontade de crescer' },
      { valor: 'coletivo',    label: '🤝 Espírito coletivo', desc: 'Saber jogar para o time' },
    ],
  },
  {
    key: 'objetivo',
    pergunta: 'Qual seu próximo objetivo profissional?',
    opcoes: [
      { valor: 'clube_pro',     label: '🏟 Trabalhar em clube profissional', desc: 'Quero atuar nas categorias de base de um clube' },
      { valor: 'expandir',      label: '📈 Expandir minha escolinha',         desc: 'Crescer o número de alunos e estrutura' },
      { valor: 'reconhecimento',label: '🏆 Ganhar mais reconhecimento',        desc: 'Ser referência em minha região' },
      { valor: 'impacto',       label: '🌱 Revelar talentos',                  desc: 'Quero que meus atletas cheguem longe' },
    ],
  },
  {
    key: 'acompanhamento',
    pergunta: 'Como você acompanha a evolução dos seus atletas?',
    opcoes: [
      { valor: 'plataforma',  label: '📱 Plataforma digital',    desc: 'Uso ferramentas online de gestão' },
      { valor: 'planilha',    label: '📊 Planilha própria',       desc: 'Tenho um sistema manual organizado' },
      { valor: 'video',       label: '🎥 Vídeos de treino',       desc: 'Gravo e analiso os treinos' },
      { valor: 'olho',        label: '👁 Olho clínico',           desc: 'Confio na minha observação direta' },
    ],
  },
] as const

type Respostas = Record<string, string>

export default function TreinadorQuestionarioPage() {
  const router = useRouter()
  const [step,      setStep]      = useState(0)
  const [respostas, setRespostas] = useState<Respostas>({})
  const [saving,    setSaving]    = useState(false)
  const [selected,  setSelected]  = useState<string | null>(null)

  const total    = PERGUNTAS.length
  const pergunta = PERGUNTAS[step]
  const progresso = Math.round((step / total) * 100)

  async function handleNext() {
    if (!selected) return
    const novas = { ...respostas, [pergunta.key]: selected }
    setRespostas(novas)
    setSelected(null)

    if (step < total - 1) {
      setStep(s => s + 1)
    } else {
      setSaving(true)
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { questionario_treinador: novas, questionario_treinador_completo: true },
      })
      router.push('/treinador/curriculo?questionario=ok')
    }
  }

  function handleBack() {
    if (step === 0) { router.push('/treinador/bem-vindo'); return }
    setStep(s => s - 1)
    setSelected(respostas[PERGUNTAS[step - 1].key] ?? null)
  }

  return (
    <main style={{
      background: '#06080a', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      overscrollBehaviorY: 'none',
    }}>

      {/* Barra de progresso — âmbar */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{
          height: '100%', background: '#f59e0b',
          width: `${progresso}%`,
          transition: 'width 0.4s cubic-bezier(.22,1,.36,1)',
          boxShadow: '0 0 12px rgba(245,158,11,0.6)',
        }} />
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px 0' }}>
        <button onClick={handleBack} style={{
          background:'none', border:'none', cursor:'pointer',
          color:'rgba(255,255,255,0.35)', fontSize:'13px', fontWeight:600,
          fontFamily:'system-ui', padding:0,
        }}>
          ← Voltar
        </button>
        <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', fontWeight:600 }}>
          {step + 1} / {total}
        </span>
      </div>

      {/* Conteúdo */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        padding:'32px 24px', maxWidth:'480px', width:'100%', margin:'0 auto',
      }}>

        {/* Pergunta */}
        <div style={{ marginBottom:'32px' }}>
          <p style={{
            margin:'0 0 8px', fontSize:'11px', fontWeight:700,
            color:'#f59e0b', letterSpacing:'0.12em', textTransform:'uppercase',
          }}>
            Pergunta {step + 1}
          </p>
          <h2 style={{
            margin:0, fontSize:'22px', fontWeight:900, color:'white',
            lineHeight:1.2, letterSpacing:'-0.02em',
          }}>
            {pergunta.pergunta}
          </h2>
        </div>

        {/* Opções */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', flex:1 }}>
          {pergunta.opcoes.map((op) => {
            const ativo = selected === op.valor
            return (
              <button
                key={op.valor}
                onClick={() => setSelected(op.valor)}
                style={{
                  display:'flex', alignItems:'center', gap:'14px',
                  padding:'16px 18px', borderRadius:'16px', border:'none',
                  cursor:'pointer', textAlign:'left', width:'100%',
                  background: ativo ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.03)',
                  outline: ativo ? '2px solid rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.08)',
                  transition:'all .15s',
                  fontFamily:'system-ui',
                }}
              >
                <div style={{
                  width:'22px', height:'22px', borderRadius:'50%', flexShrink:0,
                  border: ativo ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.2)',
                  background: ativo ? '#f59e0b' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all .15s',
                }}>
                  {ativo && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#06080a' }} />}
                </div>

                <div>
                  <p style={{
                    margin:'0 0 2px', fontSize:'15px', fontWeight:700,
                    color: ativo ? '#fbbf24' : 'white', transition:'color .15s',
                  }}>
                    {op.label}
                  </p>
                  <p style={{
                    margin:0, fontSize:'12px', lineHeight:1.4,
                    color: ativo ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.35)',
                  }}>
                    {op.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Botão próxima */}
        <button
          onClick={handleNext}
          disabled={!selected || saving}
          style={{
            marginTop:'24px', padding:'17px', borderRadius:'14px', border:'none',
            cursor: selected && !saving ? 'pointer' : 'not-allowed',
            background: selected ? 'linear-gradient(135deg,#d97706,#f59e0b 55%,#fbbf24)' : 'rgba(255,255,255,0.06)',
            color: selected ? '#1c0a00' : 'rgba(255,255,255,0.25)',
            fontWeight:900, fontSize:'15px', letterSpacing:'0.01em',
            fontFamily:'system-ui',
            transition:'all .2s',
            boxShadow: selected ? '0 0 24px rgba(245,158,11,0.3)' : 'none',
          }}
        >
          {saving ? 'Salvando…' : step === total - 1 ? '✓ Concluir' : 'Próxima →'}
        </button>

      </div>
    </main>
  )
}
