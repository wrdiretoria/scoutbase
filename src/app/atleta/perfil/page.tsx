'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

/**
 * OVR do perfil: soma dos pesos preenchidos × 50
 * nome(15%) + posicao(15%) + cidade(10%) + dataNasc(10%) = base 50%
 * foto(15%) + bio(15%) + fisico(10%) + clube(10%) = até mais 50%
 * Total = score% × 50 → máx 50/50
 */
function calcularOVRPerfil(dados: {
  temFoto:   boolean
  temBio:    boolean
  temFisico: boolean
  temClube:  boolean
}): number {
  let score = 0.50 // base fixa (nome + posicao + cidade + dataNasc)
  if (dados.temFoto)   score += 0.15
  if (dados.temBio)    score += 0.15
  if (dados.temFisico) score += 0.10
  if (dados.temClube)  score += 0.10
  return Math.round(Math.min(score, 1.0) * 50)
}

function notaColor(n: number): string {
  if (n >= 80) return '#00FF88'
  if (n >= 60) return '#22c55e'
  if (n >= 40) return '#eab308'
  if (n >= 20) return '#f59e0b'
  return '#ef4444'
}

function formatarData(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ── Attribute Bar (read-only, animated) ───────────────────────────────────────

function AtributoBar({ icon, label, value }: { icon: string; label: string; value: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 500)
    return () => clearTimeout(t)
  }, [value])
  const cor = notaColor(value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', lineHeight: 1 }}>{icon}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {label}
          </span>
        </div>
        <span style={{ fontSize: '17px', fontWeight: 900, color: cor, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 12px ${cor}66` }}>
          {value}
        </span>
      </div>
      <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '3px',
          background: `linear-gradient(90deg,${cor}99,${cor})`,
          width: `${width}%`,
          transition: 'width 1s cubic-bezier(.22,1,.36,1)',
          boxShadow: `0 0 8px ${cor}55`,
        }} />
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type AtletaMeta = { nome: string; posicao: string; cidade: string; tipo: string }

type Curriculo = {
  bio: string; altura: string; peso: string; peDominante: string; clubeAtual: string
}

type Avaliacao = {
  velocidade:          number
  visao:               number
  forca:               number
  finalizacao:         number
  inteligencia_tatica: number
  tecnica:             number
  nota_geral:          number
  observacao:          string | null
  created_at:          string
  treinador_id:        string
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AtletaPerfilPage() {
  const router = useRouter()

  const [meta,       setMeta]       = useState<AtletaMeta | null>(null)
  const [dataNasc,   setDataNasc]   = useState<string | null>(null)
  const [uid,        setUid]        = useState<string | null>(null)
  const [athleteId,  setAthleteId]  = useState<string | null>(null)
  const [avatarUrl,  setAvatarUrl]  = useState<string>('')
  const [loading,    setLoading]    = useState(true)

  const [curriculo,  setCurriculo]  = useState<Curriculo>({
    bio: '', altura: '', peso: '', peDominante: '', clubeAtual: '',
  })

  const [avaliacao,      setAvaliacao]      = useState<Avaliacao | null>(null)
  const [treinadorNome,  setTreinadorNome]  = useState<string>('')

  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUid(user.id)

      const m = user.user_metadata as Partial<AtletaMeta>
      if (m?.tipo !== 'atleta') { router.push('/dashboard'); return }

      setMeta({
        nome:    m.nome    ?? 'Atleta',
        posicao: m.posicao ?? '',
        cidade:  m.cidade  ?? '',
        tipo:    'atleta',
      })

      // ── Perfil ──
      const { data: profile } = await supabase
        .from('profiles')
        .select('data_nascimento, bio, altura, peso, pe_dominante, clube_atual, athlete_id, avatar_url')
        .eq('id', user.id)
        .single()

      if (profile?.data_nascimento) setDataNasc(profile.data_nascimento as string)
      if (profile?.athlete_id)      setAthleteId(profile.athlete_id as string)
      if (profile?.avatar_url)      setAvatarUrl(profile.avatar_url as string)

      setCurriculo({
        bio:         (profile?.bio          as string) ?? '',
        altura:      profile?.altura        != null ? String(profile.altura) : '',
        peso:        profile?.peso          != null ? String(profile.peso)   : '',
        peDominante: (profile?.pe_dominante as string) ?? '',
        clubeAtual:  (profile?.clube_atual  as string) ?? '',
      })

      // ── Avaliação mais recente ──
      try {
        const { data: av } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (av) {
          setAvaliacao(av as Avaliacao)
          // Nome do treinador
          const { data: treinador } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', (av as Avaliacao).treinador_id)
            .single()
          setTreinadorNome(treinador?.nome as string ?? '')
        }
      } catch { /* tabela avaliacoes não criada ainda — ignorar */ }

      setLoading(false)
    }
    load()
  }, [router])

  // ── OVR ───────────────────────────────────────────────────────
  const temBio    = curriculo.bio.trim().length > 0
  const temFisico = !!(curriculo.altura && curriculo.peso && curriculo.peDominante)
  const temClube  = curriculo.clubeAtual.trim().length > 0
  const temFoto   = !!avatarUrl

  const ovrPerfil    = calcularOVRPerfil({ temFoto, temBio, temFisico, temClube })
  const ovrAvaliacao = avaliacao ? Math.round((avaliacao.nota_geral / 100) * 50) : 0
  const ovrTotal     = ovrPerfil + ovrAvaliacao

  // ── Próximo Passo — sugestões baseadas no estado do perfil ────
  const passos: { icon: string; titulo: string; sub: string }[] = []
  if (!avaliacao)  passos.push({ icon: '📋', titulo: 'Receba uma avaliação oficial',  sub: 'Compartilhe seu ID com um treinador certificado' })
  if (!temFoto)    passos.push({ icon: '📸', titulo: 'Adicione uma foto ao perfil',   sub: 'Perfis com foto têm muito mais visibilidade' })
  if (!temBio)     passos.push({ icon: '📝', titulo: 'Escreva sua apresentação',       sub: 'Conte quem você é como atleta' })
  if (!temFisico)  passos.push({ icon: '💪', titulo: 'Complete seus dados físicos',    sub: 'Altura, peso e pé dominante' })
  if (!temClube)   passos.push({ icon: '⚽', titulo: 'Informe seu clube atual',        sub: 'Mostre onde você joga agora' })
  const passosPrioritarios = passos.slice(0, 2)

  // ── Salvar currículo ──────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!uid) return
    setSaving(true); setSaveErr(null); setSaved(false)

    const res = await fetch('/api/atleta/salvar-curriculo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:      uid,
        bio:         curriculo.bio.trim(),
        altura:      curriculo.altura ? Number(curriculo.altura) : null,
        peso:        curriculo.peso   ? Number(curriculo.peso)   : null,
        peDominante: curriculo.peDominante,
        clubeAtual:  curriculo.clubeAtual.trim(),
      }),
    })

    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else { setSaveErr('Não foi possível salvar. Tente novamente.') }

    setSaving(false)
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ background: '#06100a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui' }}>Carregando perfil…</p>
      </main>
    )
  }
  if (!meta) return null

  const categoria = dataNasc ? calcularCategoria(dataNasc) : null
  const initials  = getInitials(meta.nome)
  const pos       = posAbrev(meta.posicao)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'system-ui, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: 'rgba(255,255,255,0.4)', marginBottom: '7px',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      <style>{`
        @keyframes barGrow  { from{width:0} to{width:var(--w)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse {
          0%,100%{ box-shadow:0 0 0 2px rgba(0,255,136,0.15) }
          50%    { box-shadow:0 0 0 2px rgba(0,255,136,0.38), 0 0 24px rgba(0,255,136,0.12) }
        }
        @keyframes dotPulse {
          0%,100%{ opacity:1; transform:scale(1)  }
          50%    { opacity:.4; transform:scale(.65)}
        }
        .avaliacao-card { animation: fadeUp .5s ease forwards; }
        .action-btn {
          display:flex; align-items:center; gap:10px; padding:14px 18px; border-radius:14px;
          border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03);
          color:white; text-decoration:none; font-size:14px; font-weight:600;
          transition:border-color 0.2s,background 0.2s; cursor:pointer;
        }
        .action-btn:hover { border-color:rgba(34,197,94,0.3); background:rgba(34,197,94,0.05); }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        select option { background:#0b1610; }
        textarea { resize:none; }
        textarea:focus,input:focus,select:focus { border-color:rgba(0,255,136,0.25) !important; outline:none; }
        @keyframes revealUp {
          from { opacity:0; transform:translateY(10px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .traj-btn {
          display:flex; align-items:center; gap:14px; padding:14px 18px; border-radius:16px;
          border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.025);
          color:white; text-decoration:none; width:100%; box-sizing:border-box;
          transition:border-color .2s, background .2s;
        }
        .traj-btn:hover { border-color:rgba(0,255,136,0.28); background:rgba(0,255,136,0.04); }
        .share-btn {
          width:100%; padding:16px 18px; border-radius:14px;
          border:1.5px solid rgba(0,255,136,0.28); background:rgba(0,255,136,0.06);
          color:white; font-weight:700; font-size:14px; cursor:pointer;
          font-family:system-ui,sans-serif;
          display:flex; align-items:center; gap:12px;
          transition:border-color .2s, background .2s, box-shadow .2s;
        }
        .share-btn:hover { border-color:rgba(0,255,136,0.45); background:rgba(0,255,136,0.1); box-shadow:0 0 28px rgba(0,255,136,0.1); }
        .share-btn:active { transform:scale(.98); }
        .passo-item {
          display:flex; align-items:center; gap:14px; padding:14px 16px;
          border-radius:14px; transition:border-color .2s, background .2s;
        }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ fontSize:'16px', fontWeight:800, color:'white', textDecoration:'none', letterSpacing:'0.03em' }}>
          ⚽ MEU <span style={{ color:'#22c55e' }}>CRAQUE</span>
        </Link>
        <button
          onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push('/') }}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', fontSize:'13px', cursor:'pointer' }}
        >
          Sair
        </button>
      </nav>

      <div style={{ maxWidth:'480px', margin:'0 auto', padding:'28px 20px 80px' }}>

        {/* ── Header card ── */}
        <div style={{
          borderRadius:'20px', overflow:'hidden',
          background:'#0b1610', border:'1px solid rgba(34,197,94,0.15)',
          boxShadow:'0 0 40px rgba(34,197,94,0.08)',
          marginBottom:'16px',
        }}>
          {/* Banner + foto */}
          <div style={{
            background:'linear-gradient(160deg,#15803d 0%,#064e1e 100%)',
            padding:'20px 20px 0',
            display:'flex', alignItems:'flex-end', gap:'16px',
            minHeight:'100px', position:'relative',
          }}>
            {categoria && (
              <div style={{
                position:'absolute', top:'12px', right:'14px',
                background:'rgba(0,0,0,0.4)', borderRadius:'20px',
                padding:'3px 10px', fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.8)',
              }}>
                {categoria}
              </div>
            )}
            {/* OVR total no canto superior esquerdo */}
            {ovrTotal > 0 && (
              <div style={{
                position:'absolute', top:'12px', left:'14px',
                display:'flex', flexDirection:'column', alignItems:'flex-start',
              }}>
                <span style={{
                  fontSize:'30px', fontWeight:900, lineHeight:1, letterSpacing:'-0.04em',
                  color:'white', textShadow:'0 0 20px rgba(0,255,136,0.4)',
                }}>
                  {ovrTotal}
                </span>
                <span style={{ fontSize:'8px', fontWeight:800, letterSpacing:'0.18em', color:'rgba(0,255,136,0.7)', textTransform:'uppercase' }}>
                  OVR
                </span>
              </div>
            )}
            {/* Foto ou iniciais */}
            <div style={{
              width:'72px', height:'72px', borderRadius:'50%', flexShrink:0,
              border:'3px solid #0b1610', marginBottom:'-20px', overflow:'hidden',
              boxShadow:'0 8px 24px rgba(34,197,94,0.4)',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={meta.nome} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 15%' }} />
              ) : (
                <div style={{
                  width:'100%', height:'100%',
                  background:'linear-gradient(135deg,#15803d,#4ade80)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'22px', fontWeight:900,
                }}>
                  {initials}
                </div>
              )}
            </div>
            <div style={{ paddingBottom:'16px' }}>
              <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.55)', marginLeft:'2px' }}>{pos}</span>
            </div>
          </div>

          <div style={{ padding:'28px 20px 20px' }}>
            <h1 style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:800 }}>{meta.nome}</h1>
            <p style={{ margin:'0 0 16px', fontSize:'13px', color:'rgba(255,255,255,0.4)' }}>
              {meta.posicao}{meta.cidade ? ` · ${meta.cidade}` : ''}
            </p>

            {/* OVR breakdown */}
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.10em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>
                  Progresso do perfil
                </span>
                <span style={{ fontSize:'14px', fontWeight:900, color:'#00FF88', fontVariantNumeric:'tabular-nums' }}>
                  {ovrTotal}<span style={{ fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.25)', marginLeft:'2px' }}>/100</span>
                </span>
              </div>
              {/* Barra Perfil */}
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.08em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>Perfil</span>
                  <span style={{ fontSize:'10px', fontWeight:800, color:'#22c55e', fontVariantNumeric:'tabular-nums' }}>{ovrPerfil}/50</span>
                </div>
                <div style={{ height:'4px', background:'rgba(255,255,255,0.08)', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:'3px',
                    background:'linear-gradient(90deg,#16a34a,#4ade80)',
                    width:`${(ovrPerfil / 50) * 100}%`,
                    transition:'width 1s ease',
                    boxShadow:'0 0 6px rgba(0,255,136,0.5)',
                  }} />
                </div>
              </div>
              {/* Barra Avaliação */}
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.08em', color: avaliacao ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)', textTransform:'uppercase' }}>Avaliação</span>
                  <span style={{ fontSize:'10px', fontWeight:800, color: avaliacao ? '#22c55e' : 'rgba(255,255,255,0.18)', fontVariantNumeric:'tabular-nums' }}>{ovrAvaliacao}/50</span>
                </div>
                <div style={{ height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:'3px',
                    background:'linear-gradient(90deg,#16a34a,#00FF88)',
                    width:`${(ovrAvaliacao / 50) * 100}%`,
                    transition:'width 1.2s ease',
                    boxShadow:'0 0 6px rgba(0,255,136,0.5)',
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ID do Atleta ── */}
        {athleteId && (
          <div style={{
            background:'rgba(0,255,136,0.05)', border:'1.5px solid rgba(0,255,136,0.25)',
            borderRadius:'16px', padding:'16px 20px', marginBottom:'16px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div>
              <p style={{ margin:'0 0 2px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(0,255,136,0.7)', textTransform:'uppercase' }}>
                Seu ID de Atleta
              </p>
              <p style={{ margin:0, fontSize:'26px', fontWeight:900, color:'#00FF88', letterSpacing:'0.06em', lineHeight:1 }}>
                {athleteId}
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ margin:0, fontSize:'10px', color:'rgba(255,200,0,0.7)', fontWeight:700 }}>⚠️ Guarde</p>
              <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>usado no login</p>
            </div>
          </div>
        )}

        {/* ── Stats grid ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'24px' }}>
          {[
            { label:'Ranking',    val:'—',                                         sub:'aguardando' },
            { label:'Avaliações', val: avaliacao ? '1' : '0',                     sub:'registradas' },
          ].map(s => (
            <div key={s.label} style={{
              background:'#0b1610', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:'14px', padding:'14px 12px', textAlign:'center',
            }}>
              <p style={{ margin:'0 0 2px', fontSize:'22px', fontWeight:900, color:'#22c55e' }}>{s.val}</p>
              <p style={{ margin:'0 0 2px', fontSize:'10px', fontWeight:700, color:'white', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
              <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.25)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Última Avaliação — resumo compacto ── */}
        {avaliacao && (
          <div style={{
            display:'flex', alignItems:'center', gap:'14px',
            padding:'13px 16px', marginBottom:'10px',
            background:'rgba(0,255,136,0.06)',
            border:'1px solid rgba(0,255,136,0.2)',
            borderRadius:'16px',
            animation:'revealUp .5s ease forwards',
          }}>
            <div style={{
              width:'38px', height:'38px', borderRadius:'50%', flexShrink:0,
              background:'#00FF88',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'16px', fontWeight:900, color:'#020d04',
              boxShadow:'0 0 14px rgba(0,255,136,0.4)',
            }}>
              ✓
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ margin:'0 0 2px', fontSize:'10px', fontWeight:800, color:'#00FF88', letterSpacing:'0.10em', textTransform:'uppercase' }}>
                Última avaliação oficial
              </p>
              <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.42)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {treinadorNome || 'Treinador certificado'} · {new Date(avaliacao.created_at).toLocaleDateString('pt-BR', { day:'numeric', month:'short', year:'numeric' })}
              </p>
            </div>
            <div style={{ flexShrink:0, textAlign:'center' }}>
              <span style={{
                display:'block', fontSize:'26px', fontWeight:900, lineHeight:1,
                letterSpacing:'-0.03em', fontVariantNumeric:'tabular-nums',
                color: notaColor(avaliacao.nota_geral),
                textShadow:`0 0 16px ${notaColor(avaliacao.nota_geral)}55`,
              }}>
                {avaliacao.nota_geral}
              </span>
              <span style={{ fontSize:'8px', fontWeight:700, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                nota
              </span>
            </div>
          </div>
        )}

        {/* ── Ver Trajetória ── */}
        <Link href="/atleta/historico" className="traj-btn" style={{ marginBottom:'24px', display:'flex' }}>
          <div style={{
            width:'40px', height:'40px', borderRadius:'12px', flexShrink:0,
            background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.18)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px',
          }}>
            📈
          </div>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>
              Ver minha trajetória
            </p>
            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.28)' }}>
              {avaliacao ? 'Evolução do OVR · atributos · histórico' : 'Linha do tempo da sua carreira'}
            </p>
          </div>
          <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'18px', flexShrink:0, alignSelf:'center' }}>›</span>
        </Link>

        {/* ══════════════════════════════════════════════════════
            AVALIAÇÃO OFICIAL — aparece só se houver avaliação
        ══════════════════════════════════════════════════════ */}
        {avaliacao && (
          <div className="avaliacao-card" style={{ marginBottom:'24px' }}>

            {/* Cabeçalho do card */}
            <div style={{
              borderRadius:'20px 20px 0 0', padding:'16px 20px',
              background:'rgba(0,255,136,0.07)',
              border:'1px solid rgba(0,255,136,0.22)',
              borderBottom:'none',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{
                  width:'32px', height:'32px', borderRadius:'50%',
                  background:'#00FF88', display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'16px', color:'#020d04', fontWeight:900,
                  boxShadow:'0 0 16px rgba(0,255,136,0.5)',
                }}>
                  ✓
                </div>
                <div>
                  <p style={{ margin:0, fontSize:'11px', fontWeight:800, letterSpacing:'0.12em', color:'#00FF88', textTransform:'uppercase' }}>
                    Avaliação oficial
                  </p>
                  <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>
                    {formatarData(avaliacao.created_at)}
                  </p>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', display:'block' }}>
                  Nota
                </span>
                <span style={{
                  fontSize:'26px', fontWeight:900, fontVariantNumeric:'tabular-nums',
                  color: notaColor(avaliacao.nota_geral),
                  textShadow:`0 0 20px ${notaColor(avaliacao.nota_geral)}55`,
                }}>
                  {avaliacao.nota_geral}
                </span>
              </div>
            </div>

            {/* Corpo — atributos desbloqueados */}
            <div style={{
              background:'#0b1610',
              border:'1px solid rgba(0,255,136,0.22)',
              borderTop:'1px solid rgba(0,255,136,0.10)',
              padding:'20px',
              display:'flex', flexDirection:'column', gap:'16px',
            }}>

              <p style={{ margin:0, fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
                Atributos técnicos desbloqueados
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:'13px' }}>
                <AtributoBar icon="⚡" label="Velocidade"    value={avaliacao.velocidade} />
                <AtributoBar icon="👁" label="Visão de Jogo" value={avaliacao.visao} />
                <AtributoBar icon="💪" label="Força Física"  value={avaliacao.forca} />
                <AtributoBar icon="🎯" label="Finalização"   value={avaliacao.finalizacao} />
                <AtributoBar icon="🧠" label="Int. Tática"   value={avaliacao.inteligencia_tatica} />
                <AtributoBar icon="⚽" label="Técnica"       value={avaliacao.tecnica} />
              </div>

              {/* Observação */}
              {avaliacao.observacao && (
                <>
                  <div style={{ height:'1px', background:'rgba(255,255,255,0.06)' }} />
                  <div>
                    <p style={{ margin:'0 0 8px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
                      Observação do treinador
                    </p>
                    <p style={{
                      margin:0, fontSize:'14px', lineHeight:1.7,
                      color:'rgba(255,255,255,0.65)',
                      fontStyle:'italic',
                      borderLeft:'2px solid rgba(0,255,136,0.3)',
                      paddingLeft:'14px',
                    }}>
                      "{avaliacao.observacao}"
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Assinatura */}
            <div style={{
              borderRadius:'0 0 20px 20px', padding:'14px 20px',
              background:'rgba(0,255,136,0.03)',
              border:'1px solid rgba(0,255,136,0.22)',
              borderTop:'1px solid rgba(0,255,136,0.08)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.25)' }}>
                  Avaliado por
                </p>
                <p style={{ margin:0, fontSize:'14px', fontWeight:800, color:'rgba(255,255,255,0.7)' }}>
                  {treinadorNome || 'Treinador certificado'}
                </p>
              </div>
              <div style={{
                padding:'5px 12px', borderRadius:'100px',
                background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)',
                display:'flex', alignItems:'center', gap:'6px',
              }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#00FF88', animation:'dotPulse 2.2s ease-in-out infinite' }} />
                <span style={{ fontSize:'9px', fontWeight:800, letterSpacing:'0.12em', color:'rgba(0,255,136,0.8)', textTransform:'uppercase' }}>
                  Oficial
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            ATRIBUTOS BLOQUEADOS (só se sem avaliação)
        ══════════════════════════════════════════ */}
        {!avaliacao && (
          <div style={{
            marginBottom:'24px',
            background:'rgba(255,255,255,0.02)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'18px', padding:'20px',
            position:'relative', overflow:'hidden',
          }}>
            {/* Blur overlay */}
            <div style={{
              position:'absolute', inset:0, zIndex:2,
              backdropFilter:'blur(3px)',
              background:'rgba(4,12,7,0.55)',
              borderRadius:'18px',
              display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              gap:'10px', padding:'20px', textAlign:'center',
            }}>
              <div style={{
                width:'44px', height:'44px', borderRadius:'50%',
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px',
              }}>🔒</div>
              <p style={{ margin:0, fontSize:'13px', fontWeight:800, color:'rgba(255,255,255,0.75)' }}>
                Atributos técnicos
              </p>
              <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.35)', lineHeight:1.6, maxWidth:'220px' }}>
                Disponíveis após avaliação oficial de um treinador certificado
              </p>
            </div>
            {/* Conteúdo fantasma */}
            <p style={{ margin:'0 0 14px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.15)', textTransform:'uppercase' }}>
              Atributos técnicos
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 24px', opacity:0.2 }}>
              {['Velocidade','Visão','Força','Finalização'].map(label => (
                <div key={label} style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.10em', textTransform:'uppercase' }}>{label}</span>
                    <span style={{ fontSize:'14px', fontWeight:900, color:'rgba(255,255,255,0.3)' }}>??</span>
                  </div>
                  <div style={{ height:'4px', background:'rgba(255,255,255,0.08)', borderRadius:'3px' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Próximo Passo — sua carreira continua ── */}
        {passosPrioritarios.length > 0 && (
          <div style={{ marginBottom:'24px', animation:'revealUp .5s ease forwards .12s', opacity:0 }}>
            <p style={{ margin:'0 0 12px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
              Sua carreira continua
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {passosPrioritarios.map((s, i) => (
                <div key={i} className="passo-item" style={{
                  background: i === 0 ? 'rgba(0,255,136,0.04)' : 'rgba(255,255,255,0.02)',
                  border:     i === 0 ? '1px solid rgba(0,255,136,0.15)' : '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{
                    width:'40px', height:'40px', borderRadius:'12px', flexShrink:0,
                    background: i === 0 ? 'rgba(0,255,136,0.1)'   : 'rgba(255,255,255,0.04)',
                    border:     i === 0 ? '1px solid rgba(0,255,136,0.22)' : '1px solid rgba(255,255,255,0.08)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px',
                  }}>
                    {s.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight: i === 0 ? 700 : 600, color: i === 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                      {s.titulo}
                    </p>
                    <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.28)', lineHeight:1.45 }}>
                      {s.sub}
                    </p>
                  </div>
                  {i === 0 && (
                    <span style={{ fontSize:'16px', color:'rgba(0,255,136,0.5)', flexShrink:0 }}>›</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            CURRÍCULO EDITÁVEL
        ══════════════════════════════════════════ */}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <p style={{ margin:0, fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Meu currículo
            </p>
            <Link
              href={uid ? `/jogador/${uid}` : '#'}
              target="_blank"
              style={{ fontSize:'12px', color:'#22c55e', textDecoration:'none', fontWeight:600 }}
            >
              Ver perfil público →
            </Link>
          </div>

          <div style={{
            background:'#0b1610', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'18px', padding:'22px 18px',
            display:'flex', flexDirection:'column', gap:'20px',
            marginBottom:'12px',
          }}>

            {/* Apresentação */}
            <div>
              <label style={labelStyle}>Apresentação</label>
              <textarea
                value={curriculo.bio}
                onChange={e => setCurriculo(c => ({ ...c, bio: e.target.value }))}
                placeholder="Conte quem você é como atleta. Seu estilo de jogo, pontos fortes, o que te move..."
                maxLength={280} rows={3}
                style={{ ...inputStyle, lineHeight:1.55 }}
              />
              <p style={{ margin:'5px 0 0', fontSize:'11px', color:'rgba(255,255,255,0.2)', textAlign:'right' }}>
                {curriculo.bio.length}/280
              </p>
            </div>

            {/* Clube atual */}
            <div>
              <label style={labelStyle}>Clube atual</label>
              <input
                type="text" value={curriculo.clubeAtual}
                onChange={e => setCurriculo(c => ({ ...c, clubeAtual: e.target.value }))}
                placeholder="Ex: EC Flamengo Sub-15, sem clube no momento..."
                style={inputStyle}
              />
            </div>

            {/* Dados físicos */}
            <div>
              <label style={labelStyle}>Dados físicos</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.2fr', gap:'10px' }}>
                <div>
                  <input
                    type="number" value={curriculo.altura}
                    onChange={e => setCurriculo(c => ({ ...c, altura: e.target.value }))}
                    placeholder="Altura" min={100} max={230}
                    style={{ ...inputStyle, textAlign:'center' }}
                  />
                  <p style={{ margin:'4px 0 0', fontSize:'10px', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>cm</p>
                </div>
                <div>
                  <input
                    type="number" value={curriculo.peso}
                    onChange={e => setCurriculo(c => ({ ...c, peso: e.target.value }))}
                    placeholder="Peso" min={30} max={150}
                    style={{ ...inputStyle, textAlign:'center' }}
                  />
                  <p style={{ margin:'4px 0 0', fontSize:'10px', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>kg</p>
                </div>
                <div>
                  <select
                    value={curriculo.peDominante}
                    onChange={e => setCurriculo(c => ({ ...c, peDominante: e.target.value }))}
                    style={{ ...inputStyle, appearance:'none', cursor:'pointer', textAlign:'center' }}
                  >
                    <option value="">Pé</option>
                    <option value="Direito">Direito</option>
                    <option value="Esquerdo">Esquerdo</option>
                    <option value="Ambidestro">Ambidestro</option>
                  </select>
                  <p style={{ margin:'4px 0 0', fontSize:'10px', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>dominante</p>
                </div>
              </div>
            </div>

            {/* Premium locked */}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'18px', display:'flex', flexDirection:'column', gap:'12px' }}>
              <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.25)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                Premium — em breve
              </p>
              {[
                { icon:'🎬', label:'Vídeo destaque',           desc:'Seus melhores momentos em campo' },
                { icon:'📊', label:'Estatísticas da temporada', desc:'Gols, assistências, jogos disputados' },
                { icon:'✅', label:'Badge verificado',          desc:'Selo que scouts e clubes confiam' },
              ].map(item => (
                <div key={item.label} style={{
                  display:'flex', alignItems:'center', gap:'12px',
                  padding:'12px 14px', borderRadius:'12px',
                  background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)',
                  opacity:0.55, userSelect:'none',
                }}>
                  <span style={{ fontSize:'18px', flexShrink:0 }}>{item.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ margin:0, fontSize:'13px', fontWeight:700, color:'white' }}>{item.label}</p>
                    <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>{item.desc}</p>
                  </div>
                  <span style={{ fontSize:'10px', fontWeight:800, color:'rgba(255,255,255,0.3)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'6px', padding:'3px 8px', flexShrink:0 }}>
                    🔒 PRO
                  </span>
                </div>
              ))}
            </div>
          </div>

          {saveErr && (
            <p style={{ margin:'0 0 10px', padding:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', fontSize:'13px', color:'#f87171' }}>
              {saveErr}
            </p>
          )}
          <button
            type="submit" disabled={saving}
            style={{
              width:'100%', padding:'14px', borderRadius:'14px', border:'none',
              cursor:saving ? 'not-allowed' : 'pointer',
              background:saved ? '#16a34a' : '#22c55e',
              color:'black', fontWeight:800, fontSize:'15px',
              opacity:saving ? 0.7 : 1, transition:'background 0.2s', marginBottom:'24px',
            }}
          >
            {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar currículo'}
          </button>
        </form>

        {/* ── Ações ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          <button
            className="share-btn"
            onClick={() => {
              const cardUrl = uid ? `https://meucraque.com.br/jogador/${uid}` : 'https://meucraque.com.br'
              if (navigator.share) {
                navigator.share({ title:`${meta.nome} · MeuCraque`, text:`Acabei de montar meu perfil no MeuCraque! ${meta.posicao} · ${meta.cidade}. Você é o próximo?`, url:cardUrl })
              } else {
                navigator.clipboard.writeText(cardUrl)
                alert('Link copiado!')
              }
            }}
          >
            <span style={{ fontSize:'20px', flexShrink:0 }}>📲</span>
            <div style={{ flex:1, textAlign:'left' }}>
              <span style={{ display:'block', fontSize:'14px', fontWeight:700 }}>Compartilhar meu perfil</span>
              <span style={{ display:'block', fontSize:'11px', color:'rgba(255,255,255,0.42)', marginTop:'1px' }}>
                {avaliacao ? 'Com avaliação oficial · atributos desbloqueados' : 'Perfil + ID de atleta'}
              </span>
            </div>
            <span style={{ fontSize:'16px', color:'rgba(0,255,136,0.5)', flexShrink:0 }}>↗</span>
          </button>

          <Link href="/ranking" className="action-btn" style={{ justifyContent:'center', textAlign:'center' }}>
            Ver ranking geral →
          </Link>
        </div>
      </div>
    </main>
  )
}
