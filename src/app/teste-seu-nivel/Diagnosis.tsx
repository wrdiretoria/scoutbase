'use client'

import Link from 'next/link'
import { useSyncExternalStore, useState, type FormEvent } from 'react'
import styles from './diagnostico.module.css'

const questions = [
  ['Seu Instagram mostra sua posição e um lance seu com clareza?', 'Organize sua bio e fixe um lance em que você aparece.'],
  ['Você tem um currículo esportivo pronto para enviar?', 'Monte seu perfil com posição, categoria e cidade.'],
  ['Você tem uma avaliação ou feedback de um treinador?', 'Peça a um treinador um ponto forte e um ponto para desenvolver.'],
  ['Você tem vídeos jogando em que dá para identificar você?', 'Separe um lance de jogo e adicione ao seu perfil.'],
  ['Você tem vídeos treinando que mostram uma habilidade sua?', 'Grave um exercício que mostre uma habilidade da sua posição.'],
  ['Você tem uma rotina para trabalhar sua mentalidade?', 'Escolha uma rotina simples para retomar o foco depois de errar.'],
  ['Você tem empresário ou representante?', ''],
  ['Você é federado?', ''],
  ['Você tem um conselheiro que já jogou futebol?', ''],
  ['Você sabe que oportunidade procura e o que precisa apresentar?', 'Escolha uma oportunidade da sua categoria e confira o material pedido.'],
] as const

const storageKey = 'meucraque:diagnostico:v1'
const titles = ['Montando sua base', 'Organizando sua apresentação', 'Pronto para apresentar seu material']
const actions = {
  0: ['Organize sua apresentação', 'Abra sua bio, escreva posição e região e fixe um vídeo em que você aparece.', 'Ver meu perfil', '/atleta/perfil'],
  1: ['Monte seu currículo esportivo', 'Preencha posição, categoria e cidade. Depois, abra o perfil público e confira se esses dados estão fáceis de encontrar.', 'Completar meu perfil', '/atleta/perfil#identidade'],
  2: ['Peça um feedback de treinador', 'Mostre um lance seu e pergunte qual foi sua melhor decisão e o que faria diferente.', 'Encontrar treinadores', '/treinadores'],
  3: ['Escolha um vídeo de jogo', 'Separe um lance em que dê para identificar você e entender o que aconteceu antes e depois da jogada.', 'Adicionar vídeo ao meu perfil', '/atleta/perfil#highlights'],
  4: ['Grave um vídeo de treino', 'Escolha uma habilidade da sua posição e grave uma execução completa.', 'Adicionar vídeo ao meu perfil', '/atleta/perfil#highlights'],
  5: ['Defina uma rotina para retomar o foco', 'No próximo treino, teste uma sequência após errar: respirar, observar o jogo e escolher a próxima ação.', 'Ver Minha Jornada', '/#journey'],
  9: ['Escolha uma oportunidade concreta', 'Procure uma vaga da sua categoria e anote os requisitos e o material solicitado.', 'Explorar oportunidades', '/vagas'],
} as const
const choices = ['Ainda não', 'Em preparação', 'Sim']
const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}
function readResult() {
  try { return localStorage.getItem(storageKey) ?? '' } catch { return '' }
}
function readAnswers(raw: string): number[] | null {
  try {
    const values: unknown = JSON.parse(raw)
    return Array.isArray(values) && values.length === questions.length && values.every(value => Number.isInteger(value) && value >= 0 && value < choices.length) ? values : null
  } catch { return null }
}
function diagnose(answers: number[]) {
  const scored = questions.flatMap((question, index) => question[1] ? [index] : [])
  const ready = scored.filter(index => answers[index] === 2)
  const priorities = [1, 3, 0, 2, 4, 5, 9] as const
  const priority = priorities.find(index => answers[index] < 2)
  const score = Math.round(scored.reduce((total, index) => total + answers[index], 0) * 100 / (2 * scored.length))
  return {
    score,
    title: titles[score === 100 ? 2 : score >= 50 ? 1 : 0],
    ready,
    next: priority === undefined
      ? ['Coloque seu perfil em circulação', 'Revise seu material e compartilhe com um treinador ou use-o em uma oportunidade da sua categoria.', 'Abrir meu perfil', '/atleta/perfil'] as const
      : actions[priority],
  }
}

export function DiagnosisSummary() {
  const raw = useSyncExternalStore(subscribe, readResult, () => '')
  const answers = readAnswers(raw)
  if (!answers) return null
  const result = diagnose(answers)
  return <p className={styles.summary}><strong>{result.score}/100 · {result.title}</strong> · <Link href="/teste-seu-nivel">Ver meu diagnóstico</Link></p>
}

const radarAxes = [
  { label: 'Perfil', questions: [0], x: 160, y: 17 },
  { label: 'Vídeos', questions: [3, 4], x: 272, y: 92 },
  { label: 'Currículo', questions: [1], x: 231, y: 208 },
  { label: 'Avaliação', questions: [2], x: 89, y: 208 },
  { label: 'Mentalidade', questions: [5], x: 51, y: 92 },
] as const

function radarPoint(index: number, value: number) {
  const angle = index * 2 * Math.PI / radarAxes.length - Math.PI / 2
  return [160 + Math.cos(angle) * 82 * value, 114 + Math.sin(angle) * 82 * value]
}

export function CareerRadar() {
  const raw = useSyncExternalStore(subscribe, readResult, () => '')
  const answers = readAnswers(raw)
  const result = answers && diagnose(answers)
  const levels = answers && radarAxes.map(axis =>
    axis.questions.reduce((sum, index) => sum + answers[index], 0) / (2 * axis.questions.length)
  )
  return (
    <section id="radar" aria-labelledby="radar-title" style={{ marginTop: 14, padding: 18, border: '1px solid #385346', borderRadius: 16, background: 'radial-gradient(ellipse at center, #173025, var(--mc-surface) 75%)' }}>
      <p style={{ margin: '0 0 6px', color: '#b3f737', fontSize: 12, fontWeight: 800, letterSpacing: '.08em' }}>RADAR DA CARREIRA</p>
      <h2 id="radar-title" style={{ margin: '0 0 6px', fontSize: 24 }}>Seu próximo nível no futebol</h2>
      <p style={{ margin: 0, color: '#c4d0c9' }}>Descubra o que falta para sua próxima oportunidade.</p>
      <svg viewBox="0 0 320 220" role="img" aria-label={levels ? radarAxes.map((axis, index) => axis.label + ' ' + Math.round(levels[index] * 100) + '%').join(', ') : 'Cinco áreas de preparação. Responda ao teste para revelar o radar.'} style={{ display: 'block', width: '100%', maxWidth: 360, margin: '10px auto' }}>
        <g fill="none" stroke="#496458">
          {[.25, .5, .75, 1].map(level => <polygon key={level} points={radarAxes.map((_, index) => radarPoint(index, level).join(',')).join(' ')} />)}
          {radarAxes.map((axis, index) => {
            const [x, y] = radarPoint(index, 1)
            return <line key={axis.label} x1={160} y1={114} x2={x} y2={y} />
          })}
        </g>
        {levels && <polygon points={levels.map((level, index) => radarPoint(index, level).join(',')).join(' ')} fill="#b3f73733" stroke="#b3f737" strokeWidth={2} />}
        {radarAxes.map(axis => <text key={axis.label} x={axis.x} y={axis.y} fill="#edf3ed" fontSize={12} textAnchor="middle">{axis.label}</text>)}
      </svg>
      {result ? (
        <div style={{ borderTop: '1px solid #385346', paddingTop: 12 }}>
          <p style={{ margin: 0, color: '#b3f737', fontSize: 12, fontWeight: 800 }}>PRIORIDADE DA SEMANA</p>
          <h3 style={{ margin: '5px 0' }}>{result.next[0]}</h3>
          <p style={{ margin: '0 0 6px' }}>{result.next[1]}</p>
          <Link className={styles.nextLink} href={result.next[3]}>{result.next[2]} →</Link>
        </div>
      ) : <Link href="/teste-seu-nivel" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 46, padding: '8px 12px', borderRadius: 11, background: '#b3f737', color: '#101c09', fontWeight: 800 }}>Revelar meu radar →</Link>}
    </section>
  )
}

export default function Diagnosis() {
  const saved = useSyncExternalStore(subscribe, readResult, () => '')
  const [answers, setAnswers] = useState<number[] | null>(null)
  const [retake, setRetake] = useState(false)
  const [stored, setStored] = useState(true)
  const current = answers ?? (retake ? null : readAnswers(saved))
  const result = current && diagnose(current)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const values = questions.map((_, index) => Number(form.get('answer-' + index)))
    try { localStorage.setItem(storageKey, JSON.stringify(values)); setStored(true) } catch { setStored(false) }
    setAnswers(values)
    window.scrollTo(0, 0)
  }

  return (
    <main className={styles.page}>
      <Link href="/#journey">← Minha Jornada</Link>
      <h1>Teste seu nível</h1>
      {result ? (
        <section aria-live="polite">
          <p>Nota de preparação para oportunidades</p>
          <p className={styles.score}><strong>{result.score}</strong><span> / 100</span></p>
          <progress className={styles.progress} value={result.score} max={100} aria-label="Nota de preparação" />
          <h2>{result.title}</h2>
          <p>{result.ready.length} de 7 itens de preparação marcados como prontos.</p>
          {result.ready.length > 0 && (
            <>
              <h3>O que você já tem pronto</h3>
              <ul>{result.ready.map(index => <li key={index}>{[
                'Instagram com apresentação esportiva', 'Currículo esportivo', 'Feedback de treinador',
                'Vídeo de jogo', 'Vídeo de treino', 'Rotina para trabalhar a mentalidade',
                '', '', '', 'Objetivo claro para a próxima oportunidade',
              ][index]}</li>)}</ul>
            </>
          )}
          <div className={styles.next}>
            <p>Prioridade para esta semana</p>
            <h3>{result.next[0]}</h3>
            <p>{result.next[1]}</p>
            <Link className={styles.nextLink} href={result.next[3]}>{result.next[2]} →</Link>
          </div>
          <p>A nota mede sua preparação com base nas suas respostas. “Em preparação” vale metade dos pontos de “Sim”.</p>
          <p>{stored ? 'Resultado disponível em Minha Jornada neste navegador.' : 'O navegador não conseguiu salvar o resultado.'}</p>
          <div className={styles.actions}>
            {stored && <Link className={styles.nextLink} href="/#radar">Ver meu radar no feed →</Link>}
            <button type="button" onClick={() => { setAnswers(null); setRetake(true) }}>Refazer teste</button>
          </div>
        </section>
      ) : (
        <form onSubmit={submit}>
          <p>Se um treinador pedisse seu material hoje, o que você conseguiria mostrar em cinco minutos?</p>
          <p>Empresário, federação e mentor ajudam você a refletir sobre sua rede de apoio e não entram no resultado.</p>
          {questions.map(([question], index) => (
            <fieldset key={question}>
              <legend>{index + 1}. {question}</legend>
              {choices.map((choice, value) => (
                <label key={choice}><input type="radio" name={'answer-' + index} value={value} required /> {choice}</label>
              ))}
            </fieldset>
          ))}
          <label>Que característica sua explica a posição que escolheu?
            <textarea maxLength={500} placeholder="Pense em um lance que mostra isso." />
          </label>
          <label>Por que você decidiu jogar e qual é seu maior sonho no futebol?
            <textarea maxLength={500} />
          </label>
          <p>As respostas abertas são para reflexão. O diagnóstico usa as respostas de marcar.</p>
          <button type="submit">Ver meu resultado</button>
        </form>
      )}
    </main>
  )
}
