'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './game.module.css'

const W = 640, H = 380, GOAL_TOP = 132, GOAL_BOTTOM = 248
type Body = { x: number; y: number }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const controls: Record<string, string> = { ArrowUp:'up', w:'up', ArrowDown:'down', s:'down', ArrowLeft:'left', a:'left', ArrowRight:'right', d:'right', ' ':'shoot' }

export default function Challenge() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const keys = useRef(new Set<string>())
  const kick = useRef(false)
  const [match, setMatch] = useState(0)
  const [score, setScore] = useState([0, 0])
  const [seconds, setSeconds] = useState(60)
  const [ended, setEnded] = useState(false)

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx) return
    let player: Body, opponent: Body, ball: Body, vx: number, vy: number
    let goals = [0, 0], remaining = 60, previous = 0, frame = 0, shown = 60
    let direction = { x: 1, y: 0 }, cooldown = 0
    let kickoff = .7
    function reset() {
      player = { x: 215, y: 190 }; opponent = { x: 425, y: 190 }
      ball = { x: 320, y: 190 }; vx = 0; vy = 0
      kickoff = .7
    }
    reset()
    function draw() {
      if (!ctx) return
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = i % 2 ? '#175c3a' : '#1c6840'
        ctx.fillRect(i * 80, 0, 80, H)
      }
      ctx.strokeStyle = '#b9e0c7'; ctx.lineWidth = 2
      ctx.strokeRect(12, 12, 616, 356)
      ctx.beginPath(); ctx.moveTo(320, 12); ctx.lineTo(320, 368); ctx.stroke()
      ctx.beginPath(); ctx.arc(320, 190, 50, 0, Math.PI * 2); ctx.stroke()
      ctx.strokeRect(12, 106, 88, 168); ctx.strokeRect(540, 106, 88, 168)
      ctx.fillStyle = '#d5ebdd'
      ctx.fillRect(0, GOAL_TOP, 12, GOAL_BOTTOM - GOAL_TOP)
      ctx.fillRect(628, GOAL_TOP, 12, GOAL_BOTTOM - GOAL_TOP)
      for (const [body, color, label] of [[player, '#c3ff49', 'VOCÊ'], [opponent, '#ff8c70', 'CPU']] as const) {
        ctx.beginPath(); ctx.arc(body.x, body.y, 15, 0, Math.PI * 2)
        ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#101827'; ctx.stroke()
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = 'bold 13px system-ui'
        ctx.fillText(label, body.x, body.y - 21)
      }
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#101827'; ctx.stroke()
    }
    function run(now: number) {
      const dt = previous ? Math.min((now - previous) / 1000, .035) : 0
      previous = now
      if (!match) { draw(); return }
      kickoff -= dt
      if (kickoff > 0) { draw(); frame = requestAnimationFrame(run); return }
      remaining = Math.max(0, remaining - dt)
      const nextSeconds = Math.ceil(remaining)
      if (nextSeconds !== shown) { shown = nextSeconds; setSeconds(shown) }
      const x = Number(keys.current.has('right')) - Number(keys.current.has('left'))
      const y = Number(keys.current.has('down')) - Number(keys.current.has('up'))
      const length = Math.hypot(x, y)
      if (length) {
        direction = { x: x / length, y: y / length }
        player.x = clamp(player.x + direction.x * 225 * dt, 25, W - 25)
        player.y = clamp(player.y + direction.y * 225 * dt, 25, H - 25)
      }
      cooldown -= dt
      const dx = clamp(ball.x + 16, 25, W - 25) - opponent.x
      const dy = ball.y - opponent.y
      const distance = Math.hypot(dx, dy)
      if (distance > 3) {
        opponent.x = clamp(opponent.x + dx / distance * 143 * dt, 25, W - 25)
        opponent.y = clamp(opponent.y + dy / distance * 143 * dt, 25, H - 25)
      }
      const playerDistance = Math.hypot(player.x - ball.x, player.y - ball.y)
      if (kick.current && playerDistance < 38) {
        const shot = length ? direction : { x: 1, y: (190 - ball.y) / 500 }
        vx = shot.x * 505; vy = shot.y * 505
        cooldown = .22
      } else if (cooldown <= 0) {
        if (playerDistance < 24 && length) {
          vx = direction.x * 248; vy = direction.y * 248
        } else if (Math.hypot(opponent.x - ball.x, opponent.y - ball.y) < 25) {
          vx = -295; vy = (190 - ball.y) * 1.05
          cooldown = .45
        }
      }
      kick.current = false
      ball.x += vx * dt; ball.y += vy * dt
      vx *= Math.pow(.45, dt); vy *= Math.pow(.45, dt)
      if (ball.y < 20 || ball.y > H - 20) { ball.y = clamp(ball.y, 20, H - 20); vy *= -.78 }
      if (ball.x < 12 || ball.x > W - 12) {
        if (ball.y > GOAL_TOP && ball.y < GOAL_BOTTOM) {
          goals = goals.map((goal, index) => goal + Number(index === (ball.x > W / 2 ? 0 : 1)))
          setScore(goals); reset()
        } else { ball.x = clamp(ball.x, 12, W - 12); vx *= -.78 }
      }
      draw()
      if (remaining === 0) { setEnded(true); return }
      frame = requestAnimationFrame(run)
    }
    function down(event: KeyboardEvent) {
      const key = controls[event.key]
      if (!match || !key || event.altKey || event.ctrlKey || event.metaKey || (event.target instanceof HTMLElement && event.target.closest('a,button,input'))) return
      event.preventDefault()
      if (key === 'shoot' && !event.repeat) kick.current = true
      else if (key !== 'shoot') keys.current.add(key)
    }
    function up(event: KeyboardEvent) { keys.current.delete(controls[event.key]) }
    const pressed = keys.current
    function clear() { pressed.clear(); kick.current = false }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', clear)
    frame = requestAnimationFrame(run)
    return () => {
      cancelAnimationFrame(frame); clear()
      window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear)
    }
  }, [match])

  function start() {
    setScore([0, 0]); setSeconds(60); setEnded(false); setMatch(value => value + 1)
    canvas.current?.focus()
  }

  return (
    <main className={styles.page}>
      <Link href="/">← Voltar ao Feed</Link>
      <p className={styles.tag}>ARENA MEUCRAQUE · TREINO</p>
      <h1>Desafio 1×1</h1>
      <p>Você contra o computador. Ataque o gol da direita e marque mais em 60 segundos.</p>
      <div className={styles.score} aria-label="Placar">
        <strong>Você {score[0]}</strong><span>{seconds}s</span><strong>{score[1]} CPU</strong>
      </div>
      <canvas ref={canvas} width={W} height={H} tabIndex={0} aria-label="Campo de futebol 1 contra 1" />
      <div className={styles.controls} aria-label="Controles de toque">
        <div className={styles.directions}>
          {([['up', '↑', 'Cima'], ['left', '←', 'Esquerda'], ['down', '↓', 'Baixo'], ['right', '→', 'Direita']] as const).map(([key, arrow, label]) => (
            <button key={key} type="button" aria-label={label} onPointerDown={event => {
              event.currentTarget.setPointerCapture(event.pointerId); keys.current.add(key)
            }} onPointerUp={() => keys.current.delete(key)} onPointerCancel={() => keys.current.delete(key)} onLostPointerCapture={() => keys.current.delete(key)}>{arrow}</button>
          ))}
        </div>
        <button className={styles.primary} type="button" onPointerDown={() => { kick.current = true }} onClick={event => { if (event.detail === 0) kick.current = true }}>Chutar</button>
      </div>
      <p>Teclado: setas ou WASD para mover. Espaço para chutar perto da bola.</p>
      {ended && <p role="status"><strong>{score[0] === score[1] ? 'Empate!' : score[0] > score[1] ? 'Você venceu!' : 'O computador venceu.'}</strong> Placar final: {score[0]} × {score[1]}.</p>}
      {(!match || ended) && <button type="button" className={styles.primary} onClick={start}>{ended ? 'Jogar revanche' : 'Começar partida'}</button>}
    </main>
  )
}
