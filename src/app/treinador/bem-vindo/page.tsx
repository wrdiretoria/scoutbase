'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function useCounter(target: number, delay = 600, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(ease * target))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timeout)
  }, [target, delay, duration])
  return value
}

export default function TreinadorBemVindoPage() {
  const router = useRouter()

  const [nome,          setNome]         = useState('')
  const [cidade,        setCidade]       = useState('')
  const [especialidade, setEspec]        = useState('')
  const [anosExp,       setAnosExp]      = useState('')
  const [avatarUrl,     setAvatarUrl]    = useState<string | null>(null)
  const [temQuest,      setTemQuest]     = useState(false)
  const [temCurriculo,  setTemCurriculo] = useState(false)
  const [loading,       setLoading]      = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      if (user.user_metadata?.tipo === 'atleta') { router.replace('/atleta/bem-vindo'); return }

      const meta = user.user_metadata as Record<string, unknown>
      setNome((meta.nome as string) ?? 'Treinador')
      setCidade((meta.cidade as string) ?? '')
      setAnosExp((meta.anos_exp as string) ?? '')
      setTemQuest(!!(meta.questionario_treinador_completo))

      supabase.from('profiles')
        .select('bio, especialidade, avatar_url, clubes_trabalhados')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data: p }) => {
          if (p) {
            const pr = p as Record<string, unknown>
            if (pr.especialidade) setEspec(pr.especialidade as string)
            if (pr.avatar_url)    setAvatarUrl(pr.avatar_url as string)
            const temCurr = !!(pr.bio || pr.clubes_trabalhados)
            setTemCurriculo(temCurr)
          }
          setLoading(false)
        })
    })
  }, [router])

  // Progresso: base(20) + foto(20) + questionario(30) + curriculo(30)
  const pontos =
    20 +
    (avatarUrl ? 20 : 0) +
    (temQuest ? 30 : 0) +
    (temCurriculo ? 30 : 0)

  const progAnim = useCounter(pontos, 700, 900)

  const initials = getInitials(nome)
  const primeiroNome = nome.split(' ')[0]
  const sobrenome    = nome.split(' ').slice(1).join(' ')

  const statusLabel =
    pontos >= 80 ? '🏆 Perfil completo' :
    pontos >= 50 ? '📈 Perfil em destaque' :
    '⚡ Configure seu perfil'

  if (loading) {
    return (
      <main style={{ background: '#030a05', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </main>
    )
  }

  return (
    <main style={{
      background: '#06080a',
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 20px',
      paddingTop: 'max(32px, env(safe-area-inset-top))',
      paddingBottom: 'max(48px, env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>

      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowIn  { from{opacity:0;filter:blur(40px)} to{opacity:1;filter:blur(90px)} }
        @keyframes dotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.7)} }
        @keyframes pulseAmber {
          0%,100% { box-shadow: 0 0 40px rgba(245,158,11,0.12), 0 0 0 1px rgba(245,158,11,0.18), 0 28px 70px rgba(0,0,0,0.9) }
          50%     { box-shadow: 0 0 80px rgba(245,158,11,0.22), 0 0 0 1px rgba(245,158,11,0.32), 0 28px 70px rgba(0,0,0,0.9) }
        }
        .card-amber { animation: pulseAmber 4.5s ease-in-out infinite 1.5s }
        .a0 { animation: fadeUp .5s ease forwards .1s;  opacity:0 }
        .a1 { animation: fadeUp .65s ease forwards .2s; opacity:0 }
        .a2 { animation: fadeUp .5s ease forwards .8s;  opacity:0 }
        .a3 { animation: fadeUp .5s ease forwards .95s; opacity:0 }
        .a4 { animation: fadeUp .5s ease forwards 1.1s; opacity:0 }
        .a5 { animation: fadeUp .5s ease forwards 1.25s; opacity:0 }
        .step-btn {
          width:100%; padding:16px 18px; border-radius:16px; border:none;
          display:flex; align-items:center; gap:14px; cursor:pointer;
          text-align:left; font-family:system-ui,sans-serif;
          transition: opacity .15s, transform .1s;
        }
        .step-btn:active { opacity:.85; transform:scale(.98); }
      `}</style>

      {/* Atmospheres */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{
          position:'absolute', top:'-10%', left:'50%', transform:'translateX(-50%)',
          width:'700px', height:'500px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(245,158,11,0.08) 0%,transparent 65%)',
          animation:'glowIn 1.4s ease forwards',
        }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'360px', display:'flex', flexDirection:'column', alignItems:'center', gap:'20px' }}>

        {/* Badge topo */}
        <div className="a0" style={{ display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 10px #f59e0b', animation:'dotPulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize:'11px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(245,158,11,0.8)', textTransform:'uppercase' }}>
            Perfil criado
          </span>
          <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#f59e0b', boxShadow:'0 0 10px #f59e0b', animation:'dotPulse 2s ease-in-out infinite .3s' }} />
        </div>

        {/* ── CARD DO TREINADOR ── */}
        <div className="a1" style={{ width:'100%', display:'flex', justifyContent:'center' }}>
          <div style={{ position:'relative', width:'min(320px,100%)' }}>

            {/* Corner accents */}
            <div style={{ position:'absolute', top:-1, left:-1, width:'22px', height:'22px', zIndex:20, pointerEvents:'none', borderTop:'1.5px solid rgba(245,158,11,0.65)', borderLeft:'1.5px solid rgba(245,158,11,0.65)', borderTopLeftRadius:'28px' }} />
            <div style={{ position:'absolute', top:-1, right:-1, width:'22px', height:'22px', zIndex:20, pointerEvents:'none', borderTop:'1.5px solid rgba(245,158,11,0.65)', borderRight:'1.5px solid rgba(245,158,11,0.65)', borderTopRightRadius:'28px' }} />
            <div style={{ position:'absolute', bottom:-1, left:-1, width:'22px', height:'22px', zIndex:20, pointerEvents:'none', borderBottom:'1.5px solid rgba(245,158,11,0.3)', borderLeft:'1.5px solid rgba(245,158,11,0.3)', borderBottomLeftRadius:'28px' }} />
            <div style={{ position:'absolute', bottom:-1, right:-1, width:'22px', height:'22px', zIndex:20, pointerEvents:'none', borderBottom:'1.5px solid rgba(245,158,11,0.3)', borderRight:'1.5px solid rgba(245,158,11,0.3)', borderBottomRightRadius:'28px' }} />

            <div className="card-amber" style={{
              width: '100%',
              borderRadius: '28px',
              overflow: 'hidden',
              background: 'linear-gradient(170deg,#1c1200 0%,#120d00 35%,#060400 100%)',
              boxShadow: ['0 0 0 1px rgba(245,158,11,0.22)','0 0 0 2px rgba(0,0,0,0.9)','0 28px 70px rgba(0,0,0,0.95)'].join(','),
            }}>

              {/* Linha de brilho topo */}
              <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.8),transparent)' }} />

              {/* Área da foto / iniciais */}
              <div style={{ position:'relative', height:'260px', overflow:'hidden' }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nome} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 15%', filter:'contrast(1.05) brightness(0.95)' }} />
                ) : (
                  <div style={{
                    width:'100%', height:'100%',
                    background:'linear-gradient(160deg,#2d1a00 0%,#1c1000 50%,#060400 100%)',
                    display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
                  }}>
                    <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 55% at 50% 42%,rgba(245,158,11,0.14) 0%,transparent 70%)' }} />
                    <div style={{
                      position:'relative', zIndex:1, width:'110px', height:'110px', borderRadius:'50%',
                      background:'linear-gradient(145deg,#92400e,#d97706,#f59e0b)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'36px', fontWeight:900, color:'white',
                      boxShadow:'0 0 0 1px rgba(245,158,11,0.3),0 0 60px rgba(245,158,11,0.5),inset 0 1px 0 rgba(255,255,255,0.2)',
                    }}>
                      {initials}
                    </div>
                  </div>
                )}

                {/* Overlays */}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(6,4,0,1) 0%, rgba(6,4,0,0.6) 28%, transparent 60%)' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 25%)' }} />

                {/* Especialidade badge */}
                {especialidade && (
                  <div style={{
                    position:'absolute', top:'14px', right:'14px', zIndex:8,
                    background:'rgba(0,0,0,0.65)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
                    border:'1px solid rgba(245,158,11,0.45)',
                    borderRadius:'9px', padding:'4px 12px',
                    fontSize:'10px', fontWeight:800, color:'#fbbf24', letterSpacing:'0.08em',
                    boxShadow:'0 0 14px rgba(245,158,11,0.18)',
                  }}>
                    {especialidade}
                  </div>
                )}

                {/* Nome sobre foto */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:8, padding:'0 20px 20px' }}>
                  <p style={{ margin:'0 0 2px', fontSize:'32px', fontWeight:900, color:'white', letterSpacing:'-0.04em', lineHeight:1, textShadow:'0 2px 24px rgba(0,0,0,0.95)' }}>
                    {primeiroNome}
                  </p>
                  {sobrenome && (
                    <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.16em' }}>
                      {sobrenome}
                    </p>
                  )}
                </div>
              </div>

              {/* Faixa inferior */}
              <div style={{ padding:'16px 20px 22px' }}>

                <div style={{ height:'1px', background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.55),transparent)', marginBottom:'14px' }} />

                {/* Info row */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
                  <div style={{
                    display:'inline-flex', alignItems:'center', gap:'6px',
                    background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.25)',
                    borderRadius:'8px', padding:'5px 12px',
                  }}>
                    <span style={{ fontSize:'11px', fontWeight:800, color:'#fbbf24', letterSpacing:'0.08em' }}>
                      👨‍🏫 TREINADOR
                    </span>
                  </div>
                  {cidade && (
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', fontWeight:600 }}>· {cidade}</span>
                  )}
                  {anosExp && (
                    <span style={{ fontSize:'10px', color:'rgba(245,158,11,0.5)', fontWeight:700 }}>{anosExp} anos exp.</span>
                  )}
                </div>

                {/* Progresso */}
                <div style={{ marginTop:'4px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                    <span style={{ fontSize:'9px', fontWeight:800, color:'rgba(255,255,255,0.25)', textTransform:'uppercase', letterSpacing:'0.14em' }}>
                      Completude do perfil
                    </span>
                    <span style={{ fontSize:'14px', fontWeight:900, color:'#f59e0b', textShadow:'0 0 14px rgba(245,158,11,0.55)' }}>
                      {progAnim}<span style={{ fontSize:'9px', color:'rgba(255,255,255,0.2)', marginLeft:'2px' }}>/100</span>
                    </span>
                  </div>
                  <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'4px', overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:'4px',
                      background:'linear-gradient(90deg,#d97706,#f59e0b)',
                      width:`${pontos}%`,
                      transition:'width 1.2s cubic-bezier(.22,1,.36,1)',
                      boxShadow:'0 0 8px rgba(245,158,11,0.6)',
                    }} />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="a2" style={{
          display:'flex', alignItems:'center', gap:'10px',
          padding:'12px 18px', borderRadius:'12px', width:'100%',
          background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.13)',
        }}>
          <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#f59e0b', flexShrink:0, boxShadow:'0 0 10px #f59e0b', animation:'dotPulse 2.2s ease-in-out infinite' }} />
          <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.7)' }}>
            {statusLabel}
          </p>
        </div>

        {/* CTA 1: Questionário */}
        <Link href="/treinador/questionario" style={{ textDecoration:'none', width:'100%' }} className="a3">
          <div className="step-btn" style={{
            background: temQuest
              ? 'rgba(34,197,94,0.06)'
              : 'linear-gradient(135deg, rgba(245,158,11,0.09), rgba(217,119,6,0.05))',
            outline: temQuest
              ? '1px solid rgba(34,197,94,0.2)'
              : '1px solid rgba(245,158,11,0.25)',
            boxShadow: temQuest ? 'none' : '0 0 24px rgba(245,158,11,0.07)',
          }}>
            <div style={{
              width:'46px', height:'46px', borderRadius:'13px', flexShrink:0,
              background: temQuest ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
              border: temQuest ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(245,158,11,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px',
            }}>
              {temQuest ? '✅' : '⚡'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:900, color: temQuest ? '#22c55e' : '#fbbf24', letterSpacing:'-0.01em' }}>
                {temQuest ? 'Questionário concluído' : 'Definir meu perfil de treinador'}
              </p>
              <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>
                {temQuest
                  ? 'Você respondeu as 10 perguntas'
                  : 'Responda 10 perguntas e ganhe +30 pontos no perfil'}
              </p>
            </div>
            <span style={{ color: temQuest ? 'rgba(34,197,94,0.5)' : 'rgba(245,158,11,0.5)', fontSize:'20px', flexShrink:0 }}>→</span>
          </div>
        </Link>

        {/* CTA 2: Currículo */}
        <Link href="/treinador/curriculo" style={{ textDecoration:'none', width:'100%' }} className="a4">
          <div className="step-btn" style={{
            background: temCurriculo
              ? 'rgba(34,197,94,0.06)'
              : 'linear-gradient(135deg, rgba(96,165,250,0.07), rgba(59,130,246,0.04))',
            outline: temCurriculo
              ? '1px solid rgba(34,197,94,0.2)'
              : '1px solid rgba(96,165,250,0.22)',
          }}>
            <div style={{
              width:'46px', height:'46px', borderRadius:'13px', flexShrink:0,
              background: temCurriculo ? 'rgba(34,197,94,0.12)' : 'rgba(96,165,250,0.12)',
              border: temCurriculo ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(96,165,250,0.22)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px',
            }}>
              {temCurriculo ? '✅' : '📋'}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:'0 0 4px', fontSize:'14px', fontWeight:900, color: temCurriculo ? '#22c55e' : '#60a5fa', letterSpacing:'-0.01em' }}>
                {temCurriculo ? 'Currículo preenchido' : 'Completar meu currículo'}
              </p>
              <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>
                {temCurriculo
                  ? 'Histórico e certificações cadastrados'
                  : 'Clubes, certificações e conquistas valem +30 pontos'}
              </p>
            </div>
            <span style={{ color: temCurriculo ? 'rgba(34,197,94,0.5)' : 'rgba(96,165,250,0.5)', fontSize:'20px', flexShrink:0 }}>→</span>
          </div>
        </Link>

        {/* Ir para dashboard */}
        <div className="a5" style={{ width:'100%', display:'flex', flexDirection:'column', gap:'10px' }}>
          <Link href="/treinador/dashboard" style={{ textDecoration:'none', width:'100%' }}>
            <button style={{
              width:'100%', padding:'16px', borderRadius:'14px', border:'none',
              background:'linear-gradient(135deg,#d97706,#f59e0b 55%,#fbbf24)',
              color:'#1c0a00', fontWeight:900, fontSize:'15px',
              cursor:'pointer', fontFamily:'system-ui,sans-serif',
              letterSpacing:'0.04em',
              boxShadow:'0 0 32px rgba(245,158,11,0.28), 0 4px 16px rgba(0,0,0,0.4)',
              transition:'opacity .1s, transform .08s',
            }}>
              🏟 Ir para o Dashboard
            </button>
          </Link>
        </div>

        <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.1)', textAlign:'center', marginTop:'4px' }}>
          ⚽ MEU <span style={{ color:'rgba(245,158,11,0.35)' }}>CRAQUE</span> · Formando o futuro do futebol
        </p>

      </div>
    </main>
  )
}
