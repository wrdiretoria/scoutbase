'use client'

/**
 * /atleta/promover — Atleta contrata destaque na busca do scout por 30 dias.
 * Fluxo: gera Pix → mostra QR + código → webhook ativa promoção ao confirmar pagamento.
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type PixData = {
  paymentId:  string
  valor:      number
  pixPayload: string
  pixQrCode:  string
  vencimento: string
}

function diasRestantes(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86_400_000)
}

export default function AtletaPromoverPage() {
  const router = useRouter()

  const [loading,      setLoading]      = useState(true)
  const [gerando,      setGerando]      = useState(false)
  const [pix,          setPix]          = useState<PixData | null>(null)
  const [copiado,      setCopiado]      = useState(false)
  const [promovido,    setPromovido]    = useState<string | null>(null)  // ISO date de expiração
  const [erro,         setErro]         = useState<string | null>(null)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      if (user.user_metadata?.tipo !== 'atleta') { router.push('/atleta/perfil'); return }

      const promoDate = user.user_metadata?.promovido_ate as string | null
      if (promoDate && new Date(promoDate) > new Date()) {
        setPromovido(promoDate)
      }
      setLoading(false)
    }
    check()
  }, [router])

  async function handleGerar() {
    setGerando(true)
    setErro(null)
    try {
      const res = await fetch('/api/atleta/promover', { method: 'POST' })
      const json = await res.json() as PixData & { error?: string }
      if (!res.ok || json.error) { setErro(json.error ?? 'Erro ao gerar Pix.'); return }
      setPix(json)
    } catch { setErro('Erro de conexão. Tente novamente.') }
    finally { setGerando(false) }
  }

  async function handleCopiar() {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix.pixPayload)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    } catch {
      window.prompt('Copie o código Pix:', pix.pixPayload)
    }
  }

  if (loading) return (
    <main style={{ background: '#06100a', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(34,197,94,0.2)', borderTop: '3px solid #22c55e', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </main>
  )

  return (
    <main style={{ background: '#06100a', minHeight: '100dvh', fontFamily: 'system-ui, sans-serif', color: 'white', padding: '0 20px 60px' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .benefit { display:flex; align-items:flex-start; gap:12px; padding:12px 14px; border-radius:12px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); }
        .copy-btn:active { transform:scale(.97); opacity:.88; }
      `}</style>

      {/* Nav */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'calc(20px + env(safe-area-inset-top)) 0 28px' }}>
        <Link href="/atleta/perfil" style={{ fontSize:13, color:'rgba(255,255,255,0.4)', textDecoration:'none' }}>
          ← Meu perfil
        </Link>
        <span style={{ fontSize:15, fontWeight:800 }}>
          ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
        </span>
        <div style={{ width:60 }} />
      </nav>

      <div style={{ maxWidth:400, margin:'0 auto', animation:'fadeUp .4s ease forwards' }}>

        {/* ── Já promovido ── */}
        {promovido && (
          <div style={{
            padding:'24px', borderRadius:20, marginBottom:20, textAlign:'center',
            background:'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))',
            border:'1px solid rgba(34,197,94,0.3)',
          }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🚀</div>
            <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:900, color:'#22c55e' }}>
              Você está em destaque!
            </h2>
            <p style={{ margin:'0 0 4px', fontSize:14, color:'rgba(255,255,255,0.6)' }}>
              Seu perfil aparece primeiro na busca dos scouts.
            </p>
            <p style={{ margin:0, fontSize:13, color:'rgba(255,255,255,0.35)' }}>
              Expira em <strong style={{ color:'white' }}>{diasRestantes(promovido)} dias</strong>
            </p>
            <Link href="/scout/busca" style={{
              display:'inline-block', marginTop:18, padding:'11px 24px', borderRadius:12,
              background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)',
              color:'#22c55e', fontWeight:700, fontSize:13, textDecoration:'none',
            }}>
              🔍 Ver como você aparece na busca →
            </Link>
          </div>
        )}

        {/* ── Header ── */}
        {!promovido && (
          <>
            <div style={{ textAlign:'center', marginBottom:28 }}>
              <div style={{
                width:60, height:60, borderRadius:'50%', margin:'0 auto 16px',
                background:'linear-gradient(135deg, #166534, #22c55e)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:26,
                boxShadow:'0 0 30px rgba(34,197,94,0.3)',
              }}>🚀</div>
              <h1 style={{ margin:'0 0 8px', fontSize:26, fontWeight:900, letterSpacing:'-0.03em' }}>
                Destaque por 30 dias
              </h1>
              <p style={{ margin:0, fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                Apareça <strong style={{ color:'white' }}>primeiro na busca dos scouts</strong> e multiplique suas chances de ser descoberto.
              </p>
            </div>

            {/* Benefícios */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
              {[
                { icon:'⭐', title:'Topo da busca', desc:'Seu perfil aparece antes de todos os atletas não promovidos' },
                { icon:'📊', title:'Badge "Em Destaque"', desc:'Selo visual que chama atenção dos scouts e clubes' },
                { icon:'👁', title:'Mais visualizações', desc:'Atletas promovidos recebem em média 5x mais visitas' },
                { icon:'📅', title:'30 dias garantidos', desc:'Ativo imediatamente após confirmar o pagamento' },
              ].map(b => (
                <div key={b.title} className="benefit">
                  <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{b.icon}</span>
                  <div>
                    <p style={{ margin:'0 0 2px', fontSize:13, fontWeight:700, color:'white' }}>{b.title}</p>
                    <p style={{ margin:0, fontSize:12, color:'rgba(255,255,255,0.38)', lineHeight:1.5 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Preço */}
            <div style={{
              textAlign:'center', padding:'20px', borderRadius:16, marginBottom:20,
              background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)',
            }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', marginBottom:4 }}>
                Valor único · sem renovação automática
              </div>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:4 }}>
                <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.5)' }}>R$</span>
                <span style={{ fontSize:52, fontWeight:900, color:'white', lineHeight:1, letterSpacing:'-0.04em' }}>9</span>
                <span style={{ fontSize:28, fontWeight:900, color:'white', lineHeight:1 }}>,90</span>
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                via Pix · confirmação imediata
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div style={{
                padding:'12px 16px', borderRadius:10, marginBottom:16,
                background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
                fontSize:13, color:'#fca5a5',
              }}>
                {erro}
              </div>
            )}

            {/* ── Pix gerado ── */}
            {pix ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {/* QR Code */}
                {pix.pixQrCode && (
                  <div style={{
                    background:'white', borderRadius:16, padding:16,
                    display:'flex', justifyContent:'center',
                  }}>
                    <img
                      src={`data:image/png;base64,${pix.pixQrCode}`}
                      alt="QR Code Pix"
                      style={{ width:200, height:200 }}
                    />
                  </div>
                )}
                {/* Payload */}
                <div style={{
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)',
                  borderRadius:12, padding:'14px 16px',
                }}>
                  <p style={{ margin:'0 0 8px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                    Código Pix (copia e cola)
                  </p>
                  <p style={{
                    margin:'0 0 12px', fontSize:11, color:'rgba(255,255,255,0.5)',
                    wordBreak:'break-all', lineHeight:1.5, fontFamily:'monospace',
                  }}>
                    {pix.pixPayload.slice(0, 60)}…
                  </p>
                  <button
                    onClick={handleCopiar}
                    className="copy-btn"
                    style={{
                      width:'100%', padding:'11px', borderRadius:10, cursor:'pointer',
                      background: copiado ? 'rgba(34,197,94,0.2)' : '#22c55e',
                      color: copiado ? '#22c55e' : 'black',
                      fontWeight:800, fontSize:14, fontFamily:'system-ui, sans-serif',
                      border: copiado ? '1px solid rgba(34,197,94,0.4)' : 'none',
                    }}
                  >
                    {copiado ? '✓ Copiado!' : '📋 Copiar código Pix'}
                  </button>
                </div>
                <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.3)', margin:0 }}>
                  Após o pagamento, seu destaque é ativado automaticamente em até 5 minutos.
                </p>
                <p style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.2)', margin:0 }}>
                  Vence em: {new Date(pix.vencimento).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ) : (
              /* Botão gerar Pix */
              <button
                onClick={handleGerar}
                disabled={gerando}
                style={{
                  width:'100%', padding:'17px', borderRadius:16, border:'none', cursor: gerando ? 'wait' : 'pointer',
                  background: gerando ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                  color:'black', fontWeight:900, fontSize:17, fontFamily:'system-ui, sans-serif',
                  boxShadow:'0 8px 28px rgba(34,197,94,0.3)',
                  transition:'opacity .2s, transform .1s',
                }}
              >
                {gerando ? 'Gerando Pix…' : '⚡ Gerar Pix — R$ 9,90'}
              </button>
            )}
          </>
        )}

        {/* Renovar se já promovido */}
        {promovido && !pix && (
          <div style={{ textAlign:'center', marginTop:8 }}>
            <button
              onClick={handleGerar}
              disabled={gerando}
              style={{
                padding:'12px 28px', borderRadius:12, border:'1px solid rgba(34,197,94,0.25)',
                background:'rgba(34,197,94,0.07)', color:'#22c55e',
                fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'system-ui, sans-serif',
              }}
            >
              {gerando ? 'Gerando…' : '🔄 Renovar por +30 dias — R$ 9,90'}
            </button>
          </div>
        )}

      </div>
    </main>
  )
}
