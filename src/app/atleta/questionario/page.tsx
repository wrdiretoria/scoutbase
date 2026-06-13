'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ── Perguntas ─────────────────────────────────────────────────────────────────

const PERGUNTAS = [
  {
    key: 'estilo',
    pergunta: 'Como você se define em campo?',
    opcoes: [
      { valor: 'finalizador',  label: 'Finalizador',  desc: 'Gosto de decidir e fazer gols' },
      { valor: 'construtor',   label: 'Construtor',   desc: 'Prefiro criar jogadas e dar assistências' },
      { valor: 'batalhador',   label: 'Batalhador',   desc: 'Corro e pressiono o tempo todo' },
      { valor: 'equilibrado',  label: 'Equilibrado',  desc: 'Me adapto conforme o jogo pede' },
    ],
  },
  {
    key: 'caracteristica',
    pergunta: 'Qual sua característica mais forte?',
    opcoes: [
      { valor: 'velocidade',   label: '⚡ Velocidade',    desc: 'Sou mais rápido que a maioria' },
      { valor: 'tecnica',      label: '🎯 Técnica',        desc: 'Meu controle de bola é diferenciado' },
      { valor: 'forca',        label: '💪 Força física',   desc: 'Minha potência física me destaca' },
      { valor: 'visao',        label: '👁 Visão de jogo',  desc: 'Enxergo jogadas antes dos outros' },
      { valor: 'lideranca',    label: '🦁 Liderança',      desc: 'Motivo e organizo o time' },
      { valor: 'garra',        label: '🔥 Garra',          desc: 'Nunca desisto, jogo até o fim' },
    ],
  },
  {
    key: 'nivel_competicao',
    pergunta: 'Qual o nível mais alto que você já competiu?',
    opcoes: [
      { valor: 'escolinha',    label: 'Escolinha',        desc: 'Futebol recreativo / escolinha' },
      { valor: 'amador',       label: 'Amador',           desc: 'Campeonatos amadores da cidade' },
      { valor: 'municipal',    label: 'Municipal',        desc: 'Campeonato municipal oficial' },
      { valor: 'estadual',     label: 'Estadual',         desc: 'Campeonato estadual' },
      { valor: 'nacional',     label: 'Nacional',         desc: 'Campeonato nacional' },
      { valor: 'profissional', label: 'Profissional',     desc: 'Já joguei ou treino em clube profissional' },
    ],
  },
  {
    key: 'clube_profissional',
    pergunta: 'Já treinou em clube com estrutura profissional?',
    opcoes: [
      { valor: 'sim_atual',    label: 'Sim, atualmente',  desc: 'Estou num clube profissional agora' },
      { valor: 'sim_passado',  label: 'Já estive',        desc: 'Já passei por um clube profissional' },
      { valor: 'nunca_quero',  label: 'Ainda não',        desc: 'Nunca, mas quero muito' },
      { valor: 'nao',          label: 'Não',              desc: 'Não tenho esse objetivo' },
    ],
  },
  {
    key: 'anos_treinando',
    pergunta: 'Quantos anos treina futebol regularmente?',
    opcoes: [
      { valor: 'menos1',       label: 'Menos de 1 ano',   desc: 'Estou começando agora' },
      { valor: '1a3',          label: '1 a 3 anos',       desc: 'Já tenho alguma base' },
      { valor: '3a5',          label: '3 a 5 anos',       desc: 'Tenho experiência sólida' },
      { valor: 'mais5',        label: 'Mais de 5 anos',   desc: 'Treino desde criança' },
    ],
  },
  {
    key: 'frequencia',
    pergunta: 'Quantas vezes por semana você treina?',
    opcoes: [
      { valor: '1a2',          label: '1 a 2 vezes',      desc: 'Treino leve na semana' },
      { valor: '3a4',          label: '3 a 4 vezes',      desc: 'Treino regular' },
      { valor: '5mais',        label: '5 ou mais',        desc: 'Treino intenso diário' },
      { valor: 'nenhuma',      label: 'Não estou treinando', desc: 'Estou parado no momento' },
    ],
  },
  {
    key: 'disponibilidade',
    pergunta: 'Você está disponível para se mudar por uma oportunidade?',
    opcoes: [
      { valor: 'qualquer',     label: 'Sim, qualquer lugar', desc: 'Vou onde a oportunidade for' },
      { valor: 'estado',       label: 'Sim, no meu estado',  desc: 'Prefiro ficar no meu estado' },
      { valor: 'nao',          label: 'Não por agora',       desc: 'Prefiro ficar na minha cidade' },
    ],
  },
  {
    key: 'objetivo',
    pergunta: 'Qual seu objetivo nos próximos 2 anos?',
    opcoes: [
      { valor: 'clube_pro',    label: 'Entrar em clube profissional', desc: 'Quero assinar meu primeiro contrato' },
      { valor: 'estadual',     label: 'Disputar campeonato estadual', desc: 'Evoluir nível competitivo' },
      { valor: 'profissional', label: 'Me tornar profissional',       desc: 'Viver do futebol' },
      { valor: 'exterior',     label: 'Jogar no exterior',            desc: 'Sonho em jogar fora do Brasil' },
    ],
  },
  {
    key: 'suporte',
    pergunta: 'Você tem alguém te acompanhando na carreira?',
    opcoes: [
      { valor: 'familia',      label: '👨‍👩‍👦 Família',          desc: 'Minha família me apoia e acompanha' },
      { valor: 'empresario',   label: '🤝 Empresário',          desc: 'Tenho um representante' },
      { valor: 'treinador',    label: '👨‍🏫 Treinador particular', desc: 'Trabalho com um preparador' },
      { valor: 'ninguem',      label: '🙋 Sozinho por agora',   desc: 'Ainda não tenho suporte' },
    ],
  },
] as const

type Respostas = Record<string, string>

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QuestionarioPage() {
  const router = useRouter()
  const [step, setStep]             = useState(0)
  const [respostas, setRespostas]   = useState<Respostas>({})
  const [saving, setSaving]         = useState(false)
  const [selected, setSelected]     = useState<string | null>(null)

  // Auth guard — redireciona para login se não houver sessão
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login')
    })
  }, [router])

  const total    = PERGUNTAS.length
  const pergunta = PERGUNTAS[step]
  const progresso = Math.round((step / total) * 100)

  function handleSelect(valor: string) {
    setSelected(valor)
  }

  async function handleNext() {
    if (!selected) return
    const novas = { ...respostas, [pergunta.key]: selected }
    setRespostas(novas)
    setSelected(null)

    if (step < total - 1) {
      setStep(s => s + 1)
    } else {
      // Última pergunta — salvar
      setSaving(true)
      const supabase = createClient()
      await supabase.auth.updateUser({
        data: { questionario: novas, questionario_completo: true },
      })
      router.push('/atleta/perfil?questionario=ok')
    }
  }

  function handleBack() {
    if (step === 0) { router.push('/atleta/bem-vindo'); return }
    setStep(s => s - 1)
    setSelected(respostas[PERGUNTAS[step - 1].key] ?? null)
  }

  return (
    <main style={{
      background: '#060d07', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column',
      padding: '0', fontFamily: 'system-ui, sans-serif',
      overscrollBehaviorY: 'none',
    }}>

      {/* Barra de progresso */}
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <div style={{
          height: '100%', background: '#00FF88',
          width: `${progresso}%`,
          transition: 'width 0.4s cubic-bezier(.22,1,.36,1)',
          boxShadow: '0 0 12px rgba(0,255,136,0.6)',
        }} />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px 0',
      }}>
        <button onClick={handleBack} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 600,
          fontFamily: 'system-ui', padding: 0,
        }}>
          ← Voltar
        </button>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
          {step + 1} / {total}
        </span>
      </div>

      {/* Conteúdo */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        padding: '32px 24px 32px', maxWidth: '480px', width: '100%', margin: '0 auto',
      }}>

        {/* Pergunta */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{
            margin: '0 0 8px', fontSize: '11px', fontWeight: 700,
            color: '#00FF88', letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            Pergunta {step + 1}
          </p>
          <h2 style={{
            margin: 0, fontSize: '22px', fontWeight: 900, color: 'white',
            lineHeight: 1.2, letterSpacing: '-0.02em',
          }}>
            {pergunta.pergunta}
          </h2>
        </div>

        {/* Opções */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {pergunta.opcoes.map((op) => {
            const ativo = selected === op.valor
            return (
              <button
                key={op.valor}
                onClick={() => handleSelect(op.valor)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '16px 18px', borderRadius: '16px', border: 'none',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: ativo ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)',
                  outline: ativo
                    ? '2px solid rgba(0,255,136,0.6)'
                    : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all .15s',
                }}
              >
                {/* Círculo seletor */}
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  border: ativo ? '2px solid #00FF88' : '2px solid rgba(255,255,255,0.2)',
                  background: ativo ? '#00FF88' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .15s',
                }}>
                  {ativo && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#060d07' }} />
                  )}
                </div>

                <div>
                  <p style={{
                    margin: '0 0 2px', fontSize: '15px', fontWeight: 700,
                    color: ativo ? '#00FF88' : 'white',
                    transition: 'color .15s',
                  }}>
                    {op.label}
                  </p>
                  <p style={{
                    margin: 0, fontSize: '12px',
                    color: ativo ? 'rgba(0,255,136,0.7)' : 'rgba(255,255,255,0.35)',
                    lineHeight: 1.4,
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
            marginTop: '24px', padding: '17px', borderRadius: '14px', border: 'none',
            cursor: selected && !saving ? 'pointer' : 'not-allowed',
            background: selected ? '#00FF88' : 'rgba(255,255,255,0.06)',
            color: selected ? '#060d07' : 'rgba(255,255,255,0.25)',
            fontWeight: 900, fontSize: '15px', letterSpacing: '0.01em',
            transition: 'all .2s',
            boxShadow: selected ? '0 0 24px rgba(0,255,136,0.3)' : 'none',
          }}
        >
          {saving ? 'Salvando…' : step === total - 1 ? '✓ Concluir' : 'Próxima →'}
        </button>

      </div>
    </main>
  )
}
