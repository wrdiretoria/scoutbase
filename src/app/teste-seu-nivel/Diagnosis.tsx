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
    return Array.isArray(values) && values.length === questions.length && values.every(value => choices[value] !== undefined) ? values : null
  } catch { return null }
}
function diagnose(answers: number[]) {
  const scored = questions.flatMap((question, index) => question[1] ? [index] : [])
  const ready = scored.filter(index => answers[index] === 2)
  const priority = [1, 3, 0, 2, 4, 5, 9].find(index => questions[index][1] && answers[index] < 2)
    ?? scored.find(index => answers[index] < 2)
  return {
    title: titles[ready.length === scored.length ? 2 : ready.length >= 3 ? 1 : 0],
    ready,
    next: priority === undefined ? 'Revise seu perfil e compartilhe com alguém de confiança.' : questions[priority][1],
  }
}

export function DiagnosisSummary() {
  const raw = useSyncExternalStore(subscribe, readResult, () => '')
  const answers = readAnswers(raw)
  if (!answers) return null
  const result = diagnose(answers)
  return <p className={styles.summary}><strong>{result.title}</strong> · <Link href="/teste-seu-nivel">Ver meu diagnóstico</Link></p>
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
          <p>Seu diagnóstico de preparação</p>
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
          <h3>Seu próximo passo</h3>
          <p>{result.next}</p>
          <p>{stored ? 'Resultado disponível em Minha Jornada neste navegador.' : 'O navegador não conseguiu salvar o resultado.'}</p>
          <div className={styles.actions}>
            <Link href="/atleta/perfil">Abrir meu perfil</Link>
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
