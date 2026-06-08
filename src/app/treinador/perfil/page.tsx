'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'

async function compressImage(file: File, maxPx = 900, quality = 0.82): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(blob ?? file), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Perfil = {
  id: string
  nome: string
  email: string
  tipo: string
  bio?: string
  avatar_url?: string
  cidade?: string
  pais?: string
  especialidade?: string
  anosExp?: string
  clubeAtual?: string
  clubesTrabalhados?: string
  certificacoes?: string
  conquistas?: string
  telefone?: string
  instagram?: string
  tiktok?: string
  youtube?: string
  outras?: string
  created_at?: string
}

type Metricas = {
  avaliacoes: number
  atletas: number
  destaques: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function formatarTempo(dateStr?: string): string {
  if (!dateStr) return 'Novo'
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (dias < 2)   return 'Novo'
  if (dias < 30)  return `${dias} dias`
  if (dias < 365) return `${Math.floor(dias / 30)} meses`
  return `${Math.floor(dias / 365)} anos`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TreinadorPerfilPage() {
  const router   = useRouter()
  const fotoRef  = useRef<HTMLInputElement>(null)

  const [perfil,        setPerfil]        = useState<Perfil | null>(null)
  const [nomeEscola,    setNomeEscola]    = useState('')
  const [metricas,      setMetricas]      = useState<Metricas>({ avaliacoes: 0, atletas: 0, destaques: 0 })
  const [loading,       setLoading]       = useState(true)
  const [copied,        setCopied]        = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  useEffect(() => {
    async function load() {
      const safetyTimeout = setTimeout(() => { setLoading(false); router.push('/login') }, 4000)
      try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { clearTimeout(safetyTimeout); setLoading(false); router.push('/login'); return }

      // ── Perfil ──
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>
      setPerfil({
        id:                user.id,
        nome:              profile?.nome ?? meta.nome as string ?? 'Treinador',
        email:             user.email ?? '',
        tipo:              (profile as Record<string, unknown>)?.tipo as string ?? 'treinador',
        bio:               profile?.bio as string | undefined,
        avatar_url:        profile?.avatar_url as string | undefined,
        cidade:            meta.cidade            as string | undefined,
        pais:              meta.pais              as string | undefined,
        especialidade:     meta.especialidade     as string | undefined,
        anosExp:           meta.anos_exp          as string | undefined,
        clubeAtual:        meta.clube_atual        as string | undefined,
        clubesTrabalhados: meta.clubes_trabalhados as string | undefined,
        certificacoes:     meta.certificacoes      as string | undefined,
        conquistas:        meta.conquistas         as string | undefined,
        telefone:          meta.telefone           as string | undefined,
        instagram:         meta.instagram          as string | undefined,
        tiktok:            meta.tiktok             as string | undefined,
        youtube:           meta.youtube            as string | undefined,
        outras:            meta.outras             as string | undefined,
        created_at:        user.created_at,
      })

      setNomeEscola(user.user_metadata?.nome_escola ?? '')

      // ── Métricas — graceful fallback se tabela não existir ──
      try {
        const { count: av } = await supabase
          .from('avaliacoes')
          .select('*', { count: 'exact', head: true })
          .eq('treinador_id', user.id)

        const { count: at } = await supabase
          .from('avaliacoes')
          .select('atleta_id', { count: 'exact', head: true })
          .eq('treinador_id', user.id)

        const { count: de } = await supabase
          .from('avaliacoes')
          .select('*', { count: 'exact', head: true })
          .eq('treinador_id', user.id)
          .gte('nota_geral', 70)

        setMetricas({ avaliacoes: av ?? 0, atletas: at ?? 0, destaques: de ?? 0 })
      } catch { /* tabela avaliacoes ainda não criada — zeros são honestos */ }

      setLoading(false)
      clearTimeout(safetyTimeout)
      } catch { setLoading(false) }
    }
    load()
  }, [router])

  // ── Share ──────────────────────────────────────────────────────────────────

  async function handleShare() {
    if (!perfil) return
    const url  = `${window.location.origin}/treinador/${perfil.id}`
    const text = `${perfil.nome} — Avaliador Oficial no MeuCraque\n${especialidade}${nomeEscola ? ` · ${nomeEscola}` : ''}\n\n${url}`
    try {
      if (navigator.share) await navigator.share({ title: `${perfil.nome} · MeuCraque`, text, url })
      else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 3000)
      }
    } catch { /* cancelado */ }
  }

  // ── Upload de foto ─────────────────────────────────────────────────────────

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const compressed = await compressImage(file)
      const fd = new FormData()
      fd.append('file', new File([compressed], 'photo.jpg', { type: 'image/jpeg' }))
      const res  = await fetch('/api/atleta/upload-foto', { method: 'POST', body: fd })
      const json = await res.json() as { ok?: boolean; url?: string; error?: string }
      if (!res.ok || !json.url) {
        alert(json.error ?? 'Erro ao enviar foto. Tente novamente.')
        return
      }
      // Cache-busting: adiciona timestamp para forçar nova requisição da imagem
      const urlFresh = json.url + '?t=' + Date.now()
      setPerfil(prev => prev ? { ...prev, avatar_url: urlFresh } : prev)
    } catch {
      alert('Erro ao enviar foto. Verifique sua conexão.')
    } finally {
      setUploadingFoto(false)
      if (fotoRef.current) fotoRef.current.value = ''
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={{ background:'#030a05', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <div className="skel" style={{ width:90, height:90, borderRadius:'50%' }} />
          <div className="skel" style={{ width:160, height:18, borderRadius:8, marginTop:4 }} />
          <div className="skel" style={{ width:110, height:14, borderRadius:6 }} />
          <div className="skel" style={{ width:240, height:52, borderRadius:16, marginTop:8 }} />
        </div>
      </main>
    )
  }
  if (!perfil) return null

  const initials     = getInitials(perfil.nome)
  const primeiroNome = perfil.nome.split(' ')[0]
  const sobrenome    = perfil.nome.split(' ').slice(1).join(' ')
  const especialidade= perfil.especialidade ?? 'Treinador de Base'
  const tempoNaPlat  = formatarTempo(perfil.created_at)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main style={{
      background: '#030a05',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 20px',
      paddingTop: 'max(28px, env(safe-area-inset-top))',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
      overscrollBehaviorY: 'none',
    }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes glowIn { from{opacity:0} to{opacity:1} }
        @keyframes ringPulse {
          0%,100% { box-shadow: 0 0 0 2px rgba(0,255,136,0.25), 0 0 18px rgba(0,255,136,0.10) }
          50%     { box-shadow: 0 0 0 2px rgba(0,255,136,0.50), 0 0 36px rgba(0,255,136,0.20) }
        }
        @keyframes badgePulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,255,136,0.3) }
          50%     { box-shadow: 0 0 0 5px rgba(0,255,136,0)  }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1; transform:scale(1)   }
          50%     { opacity:.5; transform:scale(.7) }
        }

        .a1 { animation: fadeUp .45s ease forwards .00s; opacity:0 }
        .a2 { animation: fadeUp .45s ease forwards .08s; opacity:0 }
        .a3 { animation: fadeUp .45s ease forwards .18s; opacity:0 }
        .a4 { animation: fadeUp .45s ease forwards .30s; opacity:0 }
        .a5 { animation: fadeUp .45s ease forwards .44s; opacity:0 }
        .a6 { animation: fadeUp .45s ease forwards .58s; opacity:0 }
        .a7 { animation: fadeUp .45s ease forwards .72s; opacity:0 }

        .ring-pulse { animation: ringPulse 3.5s ease-in-out infinite }
        .badge-pulse { animation: badgePulse 2.5s ease-in-out infinite }
        label:hover .foto-overlay { opacity: 1 !important }

        .btn-share {
          width:100%; padding:17px; border-radius:14px; border:none;
          background: linear-gradient(135deg,#00e87a,#00FF88 55%,#22c55e);
          color:#020d04; font-weight:900; font-size:16px; min-height:56px;
          cursor:pointer; font-family:system-ui,sans-serif; letter-spacing:0.03em;
          box-shadow: 0 0 40px rgba(0,255,136,0.3),0 4px 16px rgba(0,0,0,0.4),
                      inset 0 1px 0 rgba(255,255,255,0.25);
          transition: opacity .1s, transform .08s;
        }
        .btn-share:active { opacity:.88; transform:scale(0.97); }

        .btn-ghost {
          width:100%; padding:15px; border-radius:14px;
          border:1px solid rgba(255,255,255,0.09); background:transparent;
          color:rgba(255,255,255,0.4); font-size:14px; font-weight:600;
          cursor:pointer; font-family:system-ui,sans-serif; min-height:52px;
          transition: border-color .2s, color .2s, transform .08s;
        }
        .btn-ghost:hover  { border-color:rgba(255,255,255,0.2); color:rgba(255,255,255,0.65); }
        .btn-ghost:active { transform:scale(.98); opacity:.85; }
      `}</style>

      {/* ── Atmosfera ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{
          position:'absolute', top:'-18%', left:'50%', transform:'translateX(-50%)',
          width:'700px', height:'500px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.08) 0%,transparent 60%)',
          animation:'glowIn 1.2s ease forwards',
        }} />
        <div style={{
          position:'absolute', bottom:'-5%', right:'-20%',
          width:'500px', height:'500px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.04) 0%,transparent 65%)',
        }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'400px', display:'flex', flexDirection:'column' }}>

        {/* ── Header ── */}
        <div className="a1" style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:'36px',
        }}>
          <Link href="/treinador/dashboard" style={{ fontSize:'13px', color:'rgba(255,255,255,0.32)', textDecoration:'none', fontWeight:600 }}>
            ← Início
          </Link>
          <Link href="/" style={{ fontSize:'14px', fontWeight:800, color:'white', textDecoration:'none', opacity:0.55 }}>
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
          </Link>
          <Link href="/treinador/curriculo" style={{
            background:'none', border:'none', cursor:'pointer',
            fontSize:'12px', color:'rgba(255,255,255,0.28)', fontWeight:600,
            fontFamily:'system-ui', padding:0, textDecoration:'none',
          }}>
            Editar ✏
          </Link>
        </div>

        {/* ══════════════════════════════════════
            ZONA DE IDENTIDADE
        ══════════════════════════════════════ */}
        <div className="a2" style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', marginBottom:'20px' }}>

          {/* Foto com ring de autoridade — clicável para trocar */}
          <div style={{ position:'relative', width:'96px', height:'96px', marginBottom:'16px' }}>

            <label htmlFor="treinador-foto-input" style={{ display:'block', width:'96px', height:'96px', borderRadius:'50%', overflow:'hidden', cursor: uploadingFoto ? 'wait' : 'pointer', position:'relative' }}>
              <input
                id="treinador-foto-input"
                ref={fotoRef}
                type="file"
                accept="image/*"
                disabled={uploadingFoto}
                style={{ position:'absolute', width:'1px', height:'1px', opacity:0, pointerEvents:'none' }}
                onChange={handleFotoChange}
              />

              {perfil.avatar_url ? (
                <img
                  src={perfil.avatar_url} alt={perfil.nome}
                  style={{
                    width:'100%', height:'100%', borderRadius:'50%',
                    objectFit:'cover', objectPosition:'center 15%', display:'block',
                    filter:'contrast(1.05) saturate(1.08)',
                  }}
                />
              ) : (
                <div style={{
                  width:'100%', height:'100%', borderRadius:'50%',
                  background:'linear-gradient(145deg,#166534,#22c55e,#4ade80)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'30px', fontWeight:900, color:'white', letterSpacing:'-0.02em',
                  boxShadow:'inset 0 1px 0 rgba(255,255,255,0.2)',
                }}>
                  {initials}
                </div>
              )}

              {/* Overlay câmera */}
              <div className="foto-overlay" style={{
                position:'absolute', inset:0, borderRadius:'50%',
                background: uploadingFoto ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center',
                opacity: uploadingFoto ? 1 : perfil.avatar_url ? 0 : 1,
                transition:'opacity 0.2s',
              }}>
                <span style={{ fontSize:'20px' }}>{uploadingFoto ? '⏳' : '📷'}</span>
              </div>
            </label>

            {/* Ring de autoridade — pulsa sutilmente */}
            <div className="ring-pulse" style={{
              position:'absolute', inset:'-5px', borderRadius:'50%',
              border:'2px solid rgba(0,255,136,0.45)',
              pointerEvents:'none',
            }} />

            {/* Checkmark de verificação */}
            <div style={{
              position:'absolute', bottom:'1px', right:'1px',
              width:'28px', height:'28px', borderRadius:'50%',
              background:'#00FF88',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'14px', fontWeight:900, color:'#020d04',
              boxShadow:'0 0 14px rgba(0,255,136,0.7), 0 2px 8px rgba(0,0,0,0.6), 0 0 0 2px #030a05',
              pointerEvents:'none',
            }}>
              ✓
            </div>
          </div>

          {/* Nome */}
          <h1 style={{
            margin:'0 0 12px',
            lineHeight: 1.05,
            letterSpacing: '-0.025em',
          }}>
            <span style={{ fontSize:'30px', fontWeight:900, color:'white', display:'block' }}>
              {primeiroNome}
            </span>
            {sobrenome && (
              <span style={{ fontSize:'18px', fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'-0.01em' }}>
                {sobrenome}
              </span>
            )}
          </h1>

          {/* Badge verificado — elemento de autoridade máxima */}
          <div className="badge-pulse" style={{
            display:'inline-flex', alignItems:'center', gap:'7px',
            padding:'6px 16px', borderRadius:'100px',
            background:'rgba(0,255,136,0.10)',
            border:'1px solid rgba(0,255,136,0.35)',
            marginBottom:'12px',
          }}>
            <div style={{
              width:'5px', height:'5px', borderRadius:'50%',
              background:'#00FF88', boxShadow:'0 0 6px #00FF88',
              animation:'dotPulse 2.2s ease-in-out infinite',
            }} />
            <span style={{
              fontSize:'10px', fontWeight:800, letterSpacing:'0.12em',
              color:'#00FF88', textTransform:'uppercase',
            }}>
              Avaliador Oficial MeuCraque
            </span>
          </div>

          {/* Escola + Cidade + País */}
          {(nomeEscola || perfil.cidade || perfil.pais) && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', justifyContent:'center' }}>
              {nomeEscola && (
                <span style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.55)' }}>
                  {nomeEscola}
                </span>
              )}
              {nomeEscola && (perfil.cidade || perfil.pais) && (
                <span style={{ color:'rgba(255,255,255,0.18)', fontSize:'12px' }}>·</span>
              )}
              {(perfil.cidade || perfil.pais) && (
                <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.32)' }}>
                  {[perfil.cidade, perfil.pais].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Especialidade ── */}
        <div className="a3" style={{ display:'flex', justifyContent:'center', marginBottom:'20px' }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'9px',
            padding:'9px 20px', borderRadius:'12px',
            background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.09)',
          }}>
            <span style={{ fontSize:'16px' }}>🏆</span>
            <span style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.65)' }}>
              {especialidade}
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════
            MÉTRICAS DE CREDIBILIDADE
        ══════════════════════════════════════ */}
        <div className="a4" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:'1px',
          background:'rgba(255,255,255,0.08)',
          borderRadius:'20px',
          overflow:'hidden',
          border:'1px solid rgba(255,255,255,0.08)',
          marginBottom:'16px',
        }}>
          {[
            {
              value:     metricas.avaliacoes,
              label:     'Avaliações',
              sublabel:  'realizadas',
              highlight: metricas.avaliacoes > 0,
            },
            {
              value:     metricas.atletas,
              label:     'Atletas',
              sublabel:  'avaliados',
              highlight: metricas.atletas > 0,
            },
            {
              value:     metricas.destaques,
              label:     'Destaques',
              sublabel:  'identificados',
              highlight: metricas.destaques > 0,
            },
            {
              value:     tempoNaPlat,
              label:     'Na plataforma',
              sublabel:  '',
              highlight: false,
              isText:    true,
            },
          ].map((m, i) => (
            <div key={i} style={{
              background: '#060f09',
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
            }}>
              <span style={{
                fontSize:            m.isText ? '18px' : '32px',
                fontWeight:          900,
                color:               m.highlight ? '#00FF88' : 'white',
                fontVariantNumeric:  'tabular-nums',
                lineHeight:          1,
                letterSpacing:       '-0.03em',
                textShadow:          m.highlight ? '0 0 20px rgba(0,255,136,0.4)' : 'none',
              }}>
                {m.value}
              </span>
              <span style={{
                fontSize:      '11px',
                fontWeight:    700,
                color:         'rgba(255,255,255,0.38)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginTop:     '4px',
              }}>
                {m.label}
              </span>
              {m.sublabel && (
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.18)', fontWeight:500 }}>
                  {m.sublabel}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── CTA inline nas métricas — se tudo zero ── */}
        {metricas.avaliacoes === 0 && (
          <div className="a4" style={{
            padding:'12px 16px',
            background:'rgba(0,255,136,0.04)',
            border:'1px solid rgba(0,255,136,0.12)',
            borderRadius:'12px',
            marginBottom:'16px',
            textAlign:'center',
          }}>
            <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.35)', lineHeight:1.6 }}>
              Comece avaliando atletas para construir<br/>
              <span style={{ color:'rgba(0,255,136,0.6)', fontWeight:700 }}>sua reputação no futebol.</span>
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════
            BIO / SOBRE
        ══════════════════════════════════════ */}
        {perfil.bio ? (
          <div className="a5" style={{
            background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'18px',
            padding:'20px',
            marginBottom:'20px',
          }}>
            <p style={{
              margin:'0 0 10px',
              fontSize:'10px', fontWeight:700, letterSpacing:'0.12em',
              color:'rgba(255,255,255,0.28)', textTransform:'uppercase',
            }}>
              Sobre
            </p>
            <p style={{ margin:0, fontSize:'14px', color:'rgba(255,255,255,0.6)', lineHeight:1.75 }}>
              {perfil.bio}
            </p>
          </div>
        ) : (
          <div className="a5" style={{
            background:'rgba(0,255,136,0.025)',
            border:'1px dashed rgba(0,255,136,0.13)',
            borderRadius:'18px',
            padding:'18px 20px',
            marginBottom:'20px',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
          }}>
            <div>
              <p style={{ margin:'0 0 3px', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.4)' }}>
                Adicione uma bio
              </p>
              <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.22)', lineHeight:1.5 }}>
                Atletas confiam mais em treinadores com apresentação
              </p>
            </div>
            <span style={{ fontSize:'18px', opacity:0.5 }}>✏</span>
          </div>
        )}

        {/* ══════════════════════════════════════
            AÇÕES
        ══════════════════════════════════════ */}
        <div className="a6" style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

          <button className="btn-share" onClick={handleShare}>
            {copied ? '✓ Link copiado!' : '📋 Compartilhar currículo'}
          </button>

          <Link href="/treinador/curriculo" className="btn-ghost" style={{ textDecoration:'none', display:'block', textAlign:'center' }}>
            ✏ Editar currículo
          </Link>
        </div>

        {/* ════════════════════════════════════
            CURRÍCULO — seções visíveis
        ════════════════════════════════════ */}

        {/* Onde trabalha atualmente */}
        {perfil.clubeAtual && (
          <div className="a6" style={{
            background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'18px', padding:'18px 20px', marginTop:'12px',
          }}>
            <p style={{ margin:'0 0 6px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
              📍 Onde trabalha atualmente
            </p>
            <p style={{ margin:0, fontSize:'14px', color:'rgba(255,255,255,0.65)', lineHeight:1.6, fontWeight:600 }}>
              {perfil.clubeAtual}
            </p>
          </div>
        )}

        {/* Histórico */}
        {(perfil.clubesTrabalhados || perfil.certificacoes || perfil.conquistas || perfil.anosExp) && (
          <div className="a6" style={{
            background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'18px', padding:'20px', marginTop:'12px',
            display:'flex', flexDirection:'column', gap:'16px',
          }}>
            <p style={{ margin:0, fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
              📋 Currículo
            </p>
            {perfil.anosExp && (
              <div>
                <p style={{ margin:'0 0 3px', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Anos de experiência</p>
                <p style={{ margin:0, fontSize:'14px', color:'rgba(255,255,255,0.6)', fontWeight:600 }}>{perfil.anosExp} anos</p>
              </div>
            )}
            {perfil.clubesTrabalhados && (
              <div>
                <p style={{ margin:'0 0 3px', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Experiências anteriores</p>
                <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.55)', lineHeight:1.75, whiteSpace:'pre-line' }}>{perfil.clubesTrabalhados}</p>
              </div>
            )}
            {perfil.certificacoes && (
              <div>
                <p style={{ margin:'0 0 3px', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Certificações e licenças</p>
                <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.55)', lineHeight:1.75, whiteSpace:'pre-line' }}>{perfil.certificacoes}</p>
              </div>
            )}
            {perfil.conquistas && (
              <div>
                <p style={{ margin:'0 0 3px', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Conquistas e títulos</p>
                <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.55)', lineHeight:1.75, whiteSpace:'pre-line' }}>{perfil.conquistas}</p>
              </div>
            )}
          </div>
        )}

        {/* Contato + Redes */}
        {(perfil.telefone || perfil.instagram || perfil.tiktok || perfil.youtube || perfil.outras) && (
          <div className="a6" style={{
            background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'18px', padding:'18px 20px', marginTop:'12px',
          }}>
            <p style={{ margin:'0 0 14px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
              📲 Contato
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {perfil.telefone && (
                <a href={`https://wa.me/${perfil.telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'100px',
                  background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)',
                  color:'#4ade80', fontSize:'13px', fontWeight:700, textDecoration:'none',
                }}>
                  📞 {perfil.telefone}
                </a>
              )}
              {perfil.instagram && (
                <a href={`https://instagram.com/${perfil.instagram}`} target="_blank" rel="noopener noreferrer" style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'100px',
                  background:'rgba(225,48,108,0.08)', border:'1px solid rgba(225,48,108,0.2)',
                  color:'#f9a8d4', fontSize:'13px', fontWeight:700, textDecoration:'none',
                }}>
                  @{perfil.instagram}
                </a>
              )}
              {perfil.tiktok && (
                <a href={`https://tiktok.com/@${perfil.tiktok}`} target="_blank" rel="noopener noreferrer" style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'100px',
                  background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)',
                  color:'rgba(255,255,255,0.7)', fontSize:'13px', fontWeight:700, textDecoration:'none',
                }}>
                  TT @{perfil.tiktok}
                </a>
              )}
              {perfil.youtube && (
                <a href={`https://youtube.com/@${perfil.youtube}`} target="_blank" rel="noopener noreferrer" style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'100px',
                  background:'rgba(255,0,0,0.08)', border:'1px solid rgba(255,0,0,0.2)',
                  color:'#fca5a5', fontSize:'13px', fontWeight:700, textDecoration:'none',
                }}>
                  YT @{perfil.youtube}
                </a>
              )}
              {perfil.outras && (
                <a href={perfil.outras.startsWith('http') ? perfil.outras : `https://${perfil.outras}`} target="_blank" rel="noopener noreferrer" style={{
                  display:'flex', alignItems:'center', gap:'6px', padding:'7px 14px', borderRadius:'100px',
                  background:'rgba(96,165,250,0.08)', border:'1px solid rgba(96,165,250,0.2)',
                  color:'#93c5fd', fontSize:'13px', fontWeight:700, textDecoration:'none',
                }}>
                  🔗 {perfil.outras.replace(/^https?:\/\//,'')}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Prompt se currículo vazio */}
        {!perfil.clubeAtual && !perfil.clubesTrabalhados && !perfil.certificacoes && !perfil.conquistas && (
          <div className="a6" style={{
            marginTop:'12px', padding:'18px 20px', borderRadius:'18px',
            background:'rgba(0,255,136,0.025)', border:'1px dashed rgba(0,255,136,0.12)',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
          }}>
            <div>
              <p style={{ margin:'0 0 3px', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.4)' }}>Seu currículo está vazio</p>
              <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.22)', lineHeight:1.5 }}>
                Adicione onde trabalha, certificações e conquistas para ganhar credibilidade
              </p>
            </div>
            <span style={{ fontSize:'20px', opacity:0.4 }}>📋</span>
          </div>
        )}

        {/* ── Separador ── */}
        <Link href="/treinador/avaliar" className="a7" style={{
          marginTop:'28px',
          padding:'18px 20px',
          background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:'16px',
          display:'flex', alignItems:'center', gap:'12px',
          textDecoration:'none', cursor:'pointer',
        }}>
          <div style={{
            width:'36px', height:'36px', borderRadius:'10px', flexShrink:0,
            background:'rgba(0,255,136,0.07)',
            border:'1px solid rgba(0,255,136,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px',
          }}>
            📊
          </div>
          <div>
            <p style={{ margin:'0 0 2px', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.55)' }}>
              Avaliar atleta
            </p>
            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.22)', lineHeight:1.5 }}>
              Use o ID do atleta para iniciar uma avaliação oficial
            </p>
          </div>
          <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.2)', fontSize:'18px', flexShrink:0 }}>›</span>
        </Link>

        <p style={{ marginTop:'28px', fontSize:'10px', color:'rgba(255,255,255,0.1)', textAlign:'center' }}>
          ⚽ MEUCRAQUE.com · Construindo o futebol brasileiro.
        </p>
      </div>
      <TreinadorBottomNav />
    </main>
  )
}