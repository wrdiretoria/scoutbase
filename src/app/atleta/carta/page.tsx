'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function calcularCategoria(dataNasc: string): string {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

type Atributo = { label: string; value: number; icon: string }

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CartaPage() {
  const router = useRouter()

  const [loading,         setLoading]         = useState(true)
  const [uid,             setUid]             = useState('')
  const [nome,            setNome]            = useState('')
  const [posicao,         setPosicao]         = useState('')
  const [dataNasc,        setDataNasc]        = useState('')
  const [athleteId,       setAthleteId]       = useState('')
  const [avatarUrl,       setAvatarUrl]       = useState('')
  const [ovr,             setOvr]             = useState<number | null>(null)
  const [atributos,       setAtributos]       = useState<Atributo[]>([])
  const [temAvaliacao,    setTemAvaliacao]     = useState(false)
  const [cardsDisponiveis, setCardsDisponiveis] = useState(0)

  // ── Pagamento ──
  const [gerando,   setGerando]   = useState(false)
  const [pixCode,   setPixCode]   = useState('')
  const [qrImg,     setQrImg]     = useState('')
  const [copiado,   setCopiado]   = useState(false)
  const [erroPix,   setErroPix]   = useState('')
  const [polling,   setPolling]   = useState(false)

  // Polling: após PIX gerado, verifica se cards_disponiveis aumentou
  const checkPagamento = useCallback(async () => {
    const supabase = createClient()
    // Força refresh do token para pegar user_metadata atualizado
    await supabase.auth.refreshSession()
    const { data: { user } } = await supabase.auth.getUser()
    const cards = (user?.user_metadata?.cards_disponiveis as number) ?? 0
    if (cards > 0) {
      setCardsDisponiveis(cards)
      setPolling(false)
      return true
    }
    return false
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.user_metadata?.tipo !== 'atleta') { router.push('/atleta/perfil'); return }

      setUid(user.id)
      setNome(user.user_metadata.nome ?? '')
      setPosicao(user.user_metadata.posicao ?? '')
      setCardsDisponiveis((user.user_metadata?.cards_disponiveis as number) ?? 0)

      // Perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('athlete_id, data_nascimento, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile?.athlete_id)      setAthleteId(profile.athlete_id as string)
      if (profile?.data_nascimento) setDataNasc(profile.data_nascimento as string)
      if (profile?.avatar_url)      setAvatarUrl(profile.avatar_url as string)

      // Avaliação mais recente
      try {
        const { data: av } = await supabase
          .from('avaliacoes')
          .select('scout_score, velocidade, tecnica, forca, finalizacao, visao_jogo, posicionamento')
          .eq('aluno_id', user.id)
          .not('scout_score', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (av) {
          setTemAvaliacao(true)
          setOvr(av.scout_score as number)
          setAtributos([
            { label: 'Vel',  icon: '⚡', value: (av.velocidade     as number) * 10 },
            { label: 'Tec',  icon: '🎯', value: (av.tecnica        as number) * 10 },
            { label: 'For',  icon: '💪', value: (av.forca          as number) * 10 },
            { label: 'Fin',  icon: '🥅', value: (av.finalizacao    as number) * 10 },
            { label: 'Vis',  icon: '👁', value: (av.visao_jogo     as number) * 10 },
            { label: 'Pos',  icon: '🧭', value: (av.posicionamento as number) * 10 },
          ])
        }
      } catch { /* sem avaliação */ }

      setLoading(false)
    }
    load()
  }, [router])

  // Polling após PIX gerado — para automaticamente após 15 minutos
  useEffect(() => {
    if (!polling) return
    const TIMEOUT_MS = 15 * 60 * 1000 // 15 minutos
    const inicio = Date.now()
    const interval = setInterval(async () => {
      if (Date.now() - inicio > TIMEOUT_MS) {
        clearInterval(interval)
        setPolling(false)
        setErroPix('Tempo expirado. Se você pagou, aguarde alguns minutos e recarregue a página.')
        return
      }
      const pago = await checkPagamento()
      if (pago) clearInterval(interval)
    }, 4000)
    return () => clearInterval(interval)
  }, [polling, checkPagamento])

  async function gerarPix() {
    setGerando(true); setErroPix('')
    try {
      const res = await fetch('/api/atleta/carta-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, nomeAtleta: nome }),
      })
      const json = await res.json() as {
        ok: boolean; bonus?: boolean
        pixCode?: string; qrCodeImage?: string; error?: string
      }
      if (!res.ok || !json.ok) { setErroPix(json.error ?? 'Erro ao gerar PIX.'); return }
      if (json.bonus) {
        // Primeiro card gratuito — atualiza estado
        setCardsDisponiveis(1)
        return
      }
      setPixCode(json.pixCode ?? '')
      setQrImg(json.qrCodeImage ?? '')
      setPolling(true)
    } catch {
      setErroPix('Erro de conexão. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  function copiarPix() {
    navigator.clipboard.writeText(pixCode).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    })
  }

  if (loading) {
    return (
      <main style={{ background: '#06100a', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(0,255,136,0.2)', borderTopColor: '#00FF88', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  const categoria   = dataNasc ? calcularCategoria(dataNasc) : ''
  const pos         = posAbrev(posicao)
  const primeiroNome = nome.split(' ')[0]
  const sobrenome    = nome.split(' ').slice(1).join(' ')
  const ovrDisplay   = ovr ?? '—'
  const anoAtual     = new Date().getFullYear()

  // ── NAV comum ────────────────────────────────────────────────────────────────
  const nav = (
    <div style={{ width: '100%', maxWidth: '340px', display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
      <button
        onClick={() => router.push('/atleta/perfil')}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
      >
        ← Perfil
      </button>
      <span style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>
        ⚽ MEU <span style={{ color: '#00FF88' }}>CRAQUE</span>
      </span>
      <div style={{ width: 60 }} />
    </div>
  )

  // ── 1. TEM AVALIAÇÃO — mostra o card visual para compartilhar ───────────────
  if (temAvaliacao) {
    return (
      <main style={{
        background: '#030a05', minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 20px 60px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <style>{`
          @keyframes cardIn { from{opacity:0;transform:translateY(30px) scale(0.94)} to{opacity:1;transform:translateY(0) scale(1)} }
          @keyframes shimmer { 0%{left:-50%} 100%{left:150%} }
          @keyframes glowPulse {
            0%,100%{ box-shadow:0 0 40px rgba(0,255,136,0.15),0 0 0 1px rgba(0,255,136,0.2),0 24px 60px rgba(0,0,0,0.9) }
            50%    { box-shadow:0 0 80px rgba(0,255,136,0.28),0 0 0 1px rgba(0,255,136,0.35),0 24px 60px rgba(0,0,0,0.9) }
          }
          .carta { animation: cardIn .6s cubic-bezier(.22,.68,0,1.1) forwards; }
          .glow-pulse { animation: glowPulse 4s ease-in-out infinite 1s; }
        `}</style>

        {nav}

        {/* ── O CARD VISUAL ── */}
        <div className="carta" style={{ position: 'relative', width: 'min(320px,100%)' }}>

          {/* Corner accents */}
          {[
            { top:-2, left:-2, borderTop:'2px solid rgba(0,255,136,0.7)', borderLeft:'2px solid rgba(0,255,136,0.7)', borderTopLeftRadius:28 },
            { top:-2, right:-2, borderTop:'2px solid rgba(0,255,136,0.7)', borderRight:'2px solid rgba(0,255,136,0.7)', borderTopRightRadius:28 },
            { bottom:-2, left:-2, borderBottom:'2px solid rgba(0,255,136,0.4)', borderLeft:'2px solid rgba(0,255,136,0.4)', borderBottomLeftRadius:28 },
            { bottom:-2, right:-2, borderBottom:'2px solid rgba(0,255,136,0.4)', borderRight:'2px solid rgba(0,255,136,0.4)', borderBottomRightRadius:28 },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', width: 24, height: 24, zIndex: 20, pointerEvents: 'none', ...s }} />
          ))}

          <div className="glow-pulse" style={{
            borderRadius: 28, overflow: 'hidden',
            background: 'linear-gradient(170deg,#122018 0%,#0a1912 35%,#050e08 100%)',
          }}>
            {/* Shimmer top line */}
            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,rgba(0,255,136,0.9),transparent)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)', animation: 'shimmer 2.5s ease-in-out infinite 1.5s' }} />
            </div>

            {/* Dot texture */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px,transparent 1px)', backgroundSize: '18px 18px', zIndex: 0 }} />

            {/* Foto */}
            <div style={{ position: 'relative', height: 280, overflow: 'hidden', zIndex: 1 }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', filter: 'contrast(1.05) saturate(1.1)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#1a3828,#040c07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 72, fontWeight: 900, color: 'rgba(0,255,136,0.5)' }}>{nome[0]}</span>
                </div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(5,14,8,1) 0%,rgba(5,14,8,0.7) 25%,transparent 60%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,rgba(5,14,8,0.5) 0%,transparent 25%,transparent 75%,rgba(5,14,8,0.4) 100%)' }} />

              {/* OVR badge */}
              <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 8 }}>
                <div style={{
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0,255,136,0.45)', borderRadius: 12,
                  padding: '6px 14px', textAlign: 'center',
                  boxShadow: '0 0 20px rgba(0,255,136,0.2)',
                }}>
                  <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: 'rgba(0,255,136,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>OVR</p>
                  <p style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#00FF88', lineHeight: 1, textShadow: '0 0 20px rgba(0,255,136,0.6)' }}>{ovrDisplay}</p>
                </div>
              </div>

              {/* Categoria */}
              {categoria && (
                <div style={{
                  position: 'absolute', top: 14, right: 14, zIndex: 8,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(0,255,136,0.35)', borderRadius: 10,
                  padding: '5px 12px', fontSize: 10, fontWeight: 800, color: '#00FF88', letterSpacing: '0.1em',
                }}>
                  {categoria}
                </div>
              )}

              {/* Nome */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 8, padding: '0 18px 18px' }}>
                <p style={{ margin: '0 0 2px', fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1, textShadow: '0 2px 24px rgba(0,0,0,0.95)' }}>
                  {primeiroNome}
                </p>
                {sobrenome && (
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
                    {sobrenome}
                  </p>
                )}
              </div>
            </div>

            {/* Faixa inferior */}
            <div style={{ padding: '14px 18px 20px', zIndex: 2, position: 'relative' }}>
              <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(0,255,136,0.6),transparent)', marginBottom: 14, boxShadow: '0 0 10px rgba(0,255,136,0.2)' }} />

              {/* Posição + ID */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  background: 'linear-gradient(135deg,rgba(0,255,136,0.15),rgba(0,255,136,0.07))',
                  border: '1px solid rgba(0,255,136,0.3)', borderRadius: 8, padding: '5px 14px',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 900, color: '#00FF88', letterSpacing: '0.1em' }}>{pos}</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,255,136,0.5)', letterSpacing: '0.08em' }}>
                  {athleteId}
                </span>
              </div>

              {/* Atributos */}
              {atributos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '6px', marginBottom: 14 }}>
                  {atributos.map(a => (
                    <div key={a.label} style={{ textAlign: 'center' }}>
                      <p style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 900, color: a.value >= 75 ? '#00FF88' : a.value >= 60 ? '#4ade80' : 'rgba(255,255,255,0.5)' }}>
                        {a.value}
                      </p>
                      <p style={{ margin: 0, fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {a.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Watermark */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.06))' }} />
                <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase' }}>
                  MEU CRAQUE · {anoAtual}
                </span>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left,transparent,rgba(255,255,255,0.06))' }} />
              </div>
            </div>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.6 }}>
          📲 Tire um print e compartilhe onde quiser
        </p>

        <button
          onClick={() => router.push('/atleta/perfil')}
          style={{
            marginTop: 16, padding: '14px 32px', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Voltar ao perfil
        </button>
      </main>
    )
  }

  // ── 2. CARD COMPRADO, SEM AVALIAÇÃO — orienta o atleta ────────────────────
  if (cardsDisponiveis > 0) {
    return (
      <main style={{
        background: '#06100a', minHeight: '100dvh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 20px 60px', fontFamily: 'system-ui, sans-serif',
      }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}.fu{animation:fadeUp .4s ease forwards;opacity:0}`}</style>
        {nav}
        <div className="fu" style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>

          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
            boxShadow: '0 0 30px rgba(0,255,136,0.2)',
          }}>
            🎟️
          </div>

          <div>
            <p style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: 'white' }}>
              Card de avaliação ativo!
            </p>
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 300 }}>
              Você tem <strong style={{ color: '#00FF88' }}>{cardsDisponiveis} card{cardsDisponiveis !== 1 ? 's' : ''}</strong> disponível{cardsDisponiveis !== 1 ? 'is' : ''}.<br />
              Volte ao seu perfil e envie o ID de um treinador para solicitar sua avaliação.
            </p>
          </div>

          <div style={{
            width: '100%', padding: '18px 20px', borderRadius: 16,
            background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Como funciona
            </p>
            {[
              '1. Vá ao seu perfil',
              '2. Digite o ID do treinador (MC-XXXXX)',
              '3. Envie a solicitação de avaliação',
              '4. O treinador avalia e seu OVR aparece aqui',
            ].map(step => (
              <p key={step} style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, textAlign: 'left' }}>
                {step}
              </p>
            ))}
          </div>

          <button
            onClick={() => router.push('/atleta/perfil')}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#00e87a,#00FF88 50%,#22c55e)',
              color: '#020d04', fontWeight: 900, fontSize: 15, fontFamily: 'system-ui, sans-serif',
              boxShadow: '0 0 30px rgba(0,255,136,0.25)',
            }}
          >
            Ir ao meu perfil e solicitar avaliação →
          </button>
        </div>
      </main>
    )
  }

  // ── 3. SEM CARD E SEM AVALIAÇÃO — paywall de compra ──────────────────────
  return (
    <main style={{
      background: '#06100a', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '32px 20px 60px', fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .fu  { animation: fadeUp .4s ease forwards;      opacity:0 }
        .fu2 { animation: fadeUp .4s ease forwards .1s;  opacity:0 }
        .fu3 { animation: fadeUp .4s ease forwards .2s;  opacity:0 }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {nav}

      <div style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Preview bloqueada */}
        <div className="fu" style={{
          position: 'relative', borderRadius: 24, overflow: 'hidden',
          background: 'linear-gradient(170deg,#122018,#050e08)',
          border: '1px solid rgba(0,255,136,0.2)',
          minHeight: 220,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(4px)', background: 'rgba(4,12,7,0.6)', zIndex: 2 }} />
          <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', padding: '32px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>⚽</div>
            <p style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, color: 'white' }}>Card de Avaliação</p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              Seu card oficial com OVR e atributos,<br />pronto para compartilhar
            </p>
          </div>
        </div>

        {/* O que inclui */}
        <div className="fu2" style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: '18px',
        }}>
          <p style={{ margin: '0 0 14px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            O que inclui
          </p>
          {[
            { icon: '📋', text: '1 avaliação oficial por um treinador certificado' },
            { icon: '⚡', text: 'Seus 6 atributos técnicos avaliados' },
            { icon: '🏆', text: 'Card premium com seu OVR oficial' },
            { icon: '📲', text: 'Compartilhe no WhatsApp, Instagram e TikTok' },
          ].map(item => (
            <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Área de pagamento */}
        {!pixCode ? (
          <div className="fu3" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={gerarPix}
              disabled={gerando}
              style={{
                padding: '18px', borderRadius: 16, border: 'none', cursor: gerando ? 'wait' : 'pointer',
                background: gerando ? 'rgba(0,255,136,0.15)' : 'linear-gradient(135deg,#00e87a,#00FF88 50%,#22c55e)',
                color: gerando ? 'rgba(0,255,136,0.6)' : '#020d04',
                fontWeight: 900, fontSize: 16, fontFamily: 'system-ui',
                boxShadow: gerando ? 'none' : '0 0 40px rgba(0,255,136,0.3)',
                transition: 'all .2s',
              }}
            >
              {gerando ? 'Gerando cobrança…' : '⚡ Comprar card — R$ 5,00'}
            </button>
            {erroPix && (
              <p style={{ margin: 0, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#f87171' }}>
                {erroPix}
              </p>
            )}
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
              Pagamento único · PIX ou cartão · Acesso imediato
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* QR Code */}
            {qrImg && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <img
                  src={`data:image/png;base64,${qrImg}`}
                  alt="QR Code PIX"
                  style={{ width: 180, height: 180, borderRadius: 16, border: '2px solid rgba(0,255,136,0.3)', background: 'white', padding: 8 }}
                />
              </div>
            )}

            {/* Código copia-e-cola */}
            <div style={{
              background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)',
              borderRadius: 14, padding: '14px 16px',
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: 'rgba(0,255,136,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                PIX copia e cola
              </p>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {pixCode.slice(0, 60)}…
              </p>
              <button
                onClick={copiarPix}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: copiado ? 'rgba(0,255,136,0.15)' : 'rgba(0,255,136,0.1)',
                  color: copiado ? '#00FF88' : 'rgba(255,255,255,0.7)',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                }}
              >
                {copiado ? '✓ Copiado!' : '📋 Copiar código PIX'}
              </button>
            </div>

            {/* Aguardando */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, boxShadow: '0 0 10px #f59e0b', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                Aguardando pagamento… o card é liberado automaticamente
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
