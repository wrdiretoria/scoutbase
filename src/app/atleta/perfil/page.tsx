'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AtletaBottomNav from '@/components/AtletaBottomNav'

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
 * OVR do perfil — pesos (soma = 100 → escala 0–50):
 *   Base (nome+pos+cidade+dob): 15 pts  sempre preenchidos
 *   Foto:            20 pts
 *   Questionário:    25 pts
 *   Clubes ant.:     15 pts
 *   Campeonatos:     10 pts
 *   Títulos:         10 pts
 *   Telefone:         5 pts
 */
function calcularOVRPerfil(dados: {
  temFoto:         boolean
  temQuestionario: boolean
  temClubes:       boolean
  temCampeonatos:  boolean
  temTitulos:      boolean
  temTelefone:     boolean
}): number {
  let pts = 15  // base sempre preenchida
  if (dados.temFoto)         pts += 20
  if (dados.temQuestionario) pts += 25
  if (dados.temClubes)       pts += 15
  if (dados.temCampeonatos)  pts += 10
  if (dados.temTitulos)      pts += 10
  if (dados.temTelefone)     pts += 5
  return Math.round((pts / 100) * 50)
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
  telefone: string; clubesAnteriores: string; campeonatos: string; titulos: string
}

type Avaliacao = {
  velocidade:    number   // 1-10 no banco
  visao_jogo:    number   // 1-10 no banco
  forca:         number   // 1-10 no banco
  finalizacao:   number   // 1-10 no banco
  posicionamento: number  // 1-10 no banco
  tecnica:       number   // 1-10 no banco
  scout_score:   number   // 0-100
  observacao:    string | null
  created_at:    string
  professor_id:  string
}

// ── Highlights ────────────────────────────────────────────────────────────────

type Plataforma = 'youtube' | 'tiktok' | 'instagram' | 'vimeo'

type Highlight = {
  id:            string
  url:           string
  plataforma:    Plataforma
  titulo:        string | null
  thumbnail_url: string | null
  video_id:      string
  created_at:    string
}

type ParsedVideo = { plataforma: Plataforma; videoId: string; thumbnail: string }

function parseVideoUrl(raw: string): ParsedVideo | null {
  const url = raw.trim()
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { plataforma: 'youtube', videoId: yt[1], thumbnail: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` }
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vi) return { plataforma: 'vimeo', videoId: vi[1], thumbnail: '' }
  const tt = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/)
  if (tt) return { plataforma: 'tiktok', videoId: tt[1], thumbnail: '' }
  const ig = url.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/)
  if (ig) return { plataforma: 'instagram', videoId: ig[1], thumbnail: '' }
  return null
}

function getEmbedUrl(plataforma: Plataforma, videoId: string): string {
  switch (plataforma) {
    case 'youtube':   return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`
    case 'vimeo':     return `https://player.vimeo.com/video/${videoId}?autoplay=1`
    case 'tiktok':    return `https://www.tiktok.com/embed/v2/${videoId}`
    case 'instagram': return `https://www.instagram.com/p/${videoId}/embed/`
  }
}

function getPlatformInfo(p: Plataforma): { label: string; bg: string } {
  return {
    youtube:   { label: 'YouTube',   bg: '#FF0000' },
    tiktok:    { label: 'TikTok',    bg: '#010101' },
    instagram: { label: 'Instagram', bg: '#E1306C' },
    vimeo:     { label: 'Vimeo',     bg: '#1AB7EA' },
  }[p]
}

function getThumbnail(hl: Highlight): string {
  if (hl.thumbnail_url) return hl.thumbnail_url
  if (hl.plataforma === 'youtube') return `https://img.youtube.com/vi/${hl.video_id}/hqdefault.jpg`
  return ''
}

// ── Page ──────────────────────────────────────────────────────────────────────

function AtletaPerfilContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [showQuestBanner, setShowQuestBanner] = useState(false)

  useEffect(() => {
    if (searchParams.get('questionario') === 'ok') {
      setShowQuestBanner(true)
      setTimeout(() => setShowQuestBanner(false), 5000)
      // Limpa o param da URL sem recarregar
      window.history.replaceState({}, '', '/atleta/perfil')
    }
  }, [searchParams])

  const [meta,       setMeta]       = useState<AtletaMeta | null>(null)
  const [dataNasc,   setDataNasc]   = useState<string | null>(null)
  const [uid,        setUid]        = useState<string | null>(null)
  const [athleteId,  setAthleteId]  = useState<string | null>(null)
  const [avatarUrl,  setAvatarUrl]  = useState<string>('')
  const [loading,    setLoading]    = useState(true)

  const [curriculo,  setCurriculo]  = useState<Curriculo>({
    bio: '', altura: '', peso: '', peDominante: '', clubeAtual: '',
    telefone: '', clubesAnteriores: '', campeonatos: '', titulos: '',
  })
  const [questionarioConcluido, setQuestionarioConcluido] = useState(false)

  const [avaliacao,      setAvaliacao]      = useState<Avaliacao | null>(null)
  const [treinadorNome,  setTreinadorNome]  = useState<string>('')
  const [visitCount,     setVisitCount]     = useState<number>(0)
  const [favoritoCount,  setFavoritoCount]  = useState<number>(0)

  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)

  // ── Edição de identidade (nome / posição / cidade) ──
  const [editingId,    setEditingId]    = useState(false)
  const [editNome,     setEditNome]     = useState('')
  const [editPosicao,  setEditPosicao]  = useState('')
  const [editCidade,   setEditCidade]   = useState('')
  const [savingId,     setSavingId]     = useState(false)
  const [savedId,      setSavedId]      = useState(false)

  // ── Highlights state ──
  const [highlights,    setHighlights]    = useState<Highlight[]>([])
  const [showAddHL,     setShowAddHL]     = useState(false)
  const [hlUrl,         setHlUrl]         = useState('')
  const [hlParsed,      setHlParsed]      = useState<ParsedVideo | null>(null)
  const [addingHL,      setAddingHL]      = useState(false)
  const [hlError,       setHlError]       = useState<string | null>(null)
  const [playingHlId,   setPlayingHlId]   = useState<string | null>(null)
  const [deletingHlId,  setDeletingHlId]  = useState<string | null>(null)

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
      // visit_count e favorito_count vêm do user_metadata — sem precisar de coluna extra
      setVisitCount(    (user.user_metadata?.visit_count    as number | null) ?? 0)
      setFavoritoCount( (user.user_metadata?.favorito_count as number | null) ?? 0)

      // Campos DB + campos do user_metadata (sem precisar de schema change)
      const um = user.user_metadata as Record<string, unknown>
      setCurriculo({
        bio:              (profile?.bio          as string) ?? '',
        altura:           profile?.altura        != null ? String(profile.altura) : '',
        peso:             profile?.peso          != null ? String(profile.peso)   : '',
        peDominante:      (profile?.pe_dominante as string) ?? '',
        clubeAtual:       (profile?.clube_atual  as string) ?? '',
        telefone:         (um.telefone          as string) ?? '',
        clubesAnteriores: (um.clubes_anteriores as string) ?? '',
        campeonatos:      (um.campeonatos       as string) ?? '',
        titulos:          (um.titulos           as string) ?? '',
      })
      setQuestionarioConcluido(!!(um.questionario_completo))

      // ── Avaliação mais recente ──
      try {
        const { data: av } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('aluno_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (av) {
          setAvaliacao(av as Avaliacao)
          // Nome do treinador
          const { data: treinador } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', (av as Avaliacao).professor_id)
            .single()
          setTreinadorNome(treinador?.nome as string ?? '')
        }
      } catch { /* tabela avaliacoes não criada ainda — ignorar */ }

      // ── Highlights ──
      try {
        const res = await fetch('/api/atleta/highlights')
        if (res.ok) {
          const json = await res.json() as { highlights: Highlight[] }
          setHighlights(json.highlights ?? [])
        }
      } catch { /* tabela highlights não criada ainda — ignorar */ }

      setLoading(false)
    }
    load()
  }, [router])

  // ── OVR ───────────────────────────────────────────────────────
  const temFoto         = !!avatarUrl
  const temQuestionario = questionarioConcluido
  const temClubes       = curriculo.clubesAnteriores.trim().length > 0
  const temCampeonatos  = curriculo.campeonatos.trim().length > 0
  const temTitulos      = curriculo.titulos.trim().length > 0
  const temTelefone     = curriculo.telefone.trim().length > 0

  const ovrPerfil    = calcularOVRPerfil({
    temFoto, temQuestionario, temClubes, temCampeonatos, temTitulos, temTelefone,
  })
  const ovrAvaliacao = avaliacao ? Math.round((avaliacao.scout_score / 100) * 50) : 0
  const ovrTotal     = ovrPerfil + ovrAvaliacao

  // ── Próximo Passo — sugestões baseadas no estado do perfil ────
  const passos: { icon: string; titulo: string; sub: string }[] = []
  const temBio    = curriculo.bio.trim().length > 0
  const temFisico = !!(curriculo.altura && curriculo.peso && curriculo.peDominante)
  const temClube  = curriculo.clubeAtual.trim().length > 0

  if (!avaliacao)              passos.push({ icon: '📋', titulo: 'Receba uma avaliação oficial',  sub: 'Compartilhe seu ID com um treinador certificado' })
  if (highlights.length === 0) passos.push({ icon: '🎬', titulo: 'Adicione um highlight',         sub: 'Cole o link de um vídeo seu no YouTube, TikTok ou Instagram' })
  if (!temFoto)                passos.push({ icon: '📸', titulo: 'Adicione uma foto ao perfil',   sub: 'Perfis com foto têm muito mais visibilidade' })
  if (!temQuestionario)        passos.push({ icon: '⚡', titulo: 'Responda o questionário',        sub: 'Ganhe +12 pontos no seu OVR' })
  if (!temBio)                 passos.push({ icon: '📝', titulo: 'Escreva sua apresentação',       sub: 'Conte quem você é como atleta' })
  if (!temFisico)              passos.push({ icon: '💪', titulo: 'Complete seus dados físicos',    sub: 'Altura, peso e pé dominante' })
  if (!temClube)               passos.push({ icon: '⚽', titulo: 'Informe seu clube atual',        sub: 'Mostre onde você joga agora' })
  if (!temClubes)              passos.push({ icon: '🏟', titulo: 'Adicione clubes anteriores',     sub: '+15 OVR ao preencher' })
  if (!temCampeonatos)         passos.push({ icon: '🏆', titulo: 'Liste seus campeonatos',          sub: '+10 OVR ao preencher' })
  if (!temTitulos)             passos.push({ icon: '🥇', titulo: 'Adicione seus títulos',           sub: '+10 OVR ao preencher' })
  const passosPrioritarios = passos.slice(0, 2)

  // ── Highlights handlers ──────────────────────────────────────
  function handleHlUrlChange(v: string) {
    setHlUrl(v)
    setHlError(null)
    setHlParsed(parseVideoUrl(v))
  }

  async function handleAddHL() {
    if (!hlParsed) { setHlError('URL não reconhecida. Use YouTube, TikTok, Instagram ou Vimeo.'); return }
    setAddingHL(true); setHlError(null)
    try {
      const res = await fetch('/api/atleta/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: hlUrl }),
      })
      const json = await res.json() as { highlight?: Highlight; error?: string }
      if (!res.ok || !json.highlight) { setHlError(json.error ?? 'Erro ao adicionar.'); return }
      setHighlights(prev => [json.highlight!, ...prev])
      setHlUrl(''); setHlParsed(null); setShowAddHL(false)
    } catch { setHlError('Erro de conexão. Tente novamente.') }
    finally { setAddingHL(false) }
  }

  async function handleDeleteHL(id: string) {
    setDeletingHlId(id)
    try {
      await fetch(`/api/atleta/highlights/${id}`, { method: 'DELETE' })
      setHighlights(prev => prev.filter(h => h.id !== id))
      if (playingHlId === id) setPlayingHlId(null)
    } catch { /* silencia */ }
    finally { setDeletingHlId(null) }
  }

  // ── Salvar currículo ──────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!uid) return
    setSaving(true); setSaveErr(null); setSaved(false)

    // 1. Campos DB (bio, altura, peso, pé, clube atual)
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

    // 2. Campos extras via user_metadata (sem alteração de schema)
    const supabase = createClient()
    await supabase.auth.updateUser({
      data: {
        telefone:          curriculo.telefone.trim(),
        clubes_anteriores: curriculo.clubesAnteriores.trim(),
        campeonatos:       curriculo.campeonatos.trim(),
        titulos:           curriculo.titulos.trim(),
      },
    })

    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else { setSaveErr('Não foi possível salvar. Tente novamente.') }

    setSaving(false)
  }

  // ── Salvar identidade (nome / posição / cidade) ──────────────
  async function handleSaveIdentidade(e: React.FormEvent) {
    e.preventDefault()
    if (!editNome.trim()) return
    setSavingId(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: {
        nome:    editNome.trim(),
        posicao: editPosicao,
        cidade:  editCidade.trim(),
      },
    })
    if (!error) {
      setMeta(m => m ? { ...m, nome: editNome.trim(), posicao: editPosicao, cidade: editCidade.trim() } : m)
      setSavedId(true)
      setTimeout(() => { setSavedId(false); setEditingId(false) }, 1500)
    }
    setSavingId(false)
  }

  // ── Loading — skeleton ───────────────────────────────────────
  if (loading) {
    return (
      <main style={{ background: '#06100a', minHeight: '100dvh', fontFamily: 'system-ui, sans-serif' }}>
        {/* Nav */}
        <nav style={{ padding: '16px 24px', paddingTop: 'calc(16px + env(safe-area-inset-top))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'white' }}>⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span></span>
          <div className="skel" style={{ width: 32, height: 12, borderRadius: 6 }} />
        </nav>
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 20px 80px' }}>
          {/* Header card */}
          <div style={{ borderRadius: '20px', background: '#0b1610', border: '1px solid rgba(34,197,94,0.08)', marginBottom: 16, overflow: 'hidden' }}>
            <div className="skel" style={{ height: 110, borderRadius: 0 }} />
            <div style={{ padding: '28px 20px 22px' }}>
              <div className="skel" style={{ width: '52%', height: 20, marginBottom: 10 }} />
              <div className="skel" style={{ width: '36%', height: 13, marginBottom: 24 }} />
              <div className="skel" style={{ width: '100%', height: 5, borderRadius: 3, marginBottom: 8 }} />
              <div className="skel" style={{ width: '100%', height: 5, borderRadius: 3 }} />
            </div>
          </div>
          {/* ID card */}
          <div className="skel" style={{ height: 76, borderRadius: 16, marginBottom: 16 }} />
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
            <div className="skel" style={{ height: 80, borderRadius: 14 }} />
            <div className="skel" style={{ height: 80, borderRadius: 14 }} />
          </div>
          {/* Trajectory button */}
          <div className="skel" style={{ height: 66, borderRadius: 16, marginBottom: 24 }} />
          {/* Form area */}
          <div className="skel" style={{ height: 44, borderRadius: 10, marginBottom: 16 }} />
          <div className="skel" style={{ height: 44, borderRadius: 10, marginBottom: 16 }} />
          <div className="skel" style={{ height: 52, borderRadius: 14, marginBottom: 8 }} />
        </div>
      </main>
    )
  }
  if (!meta) return null

  const categoria = dataNasc ? calcularCategoria(dataNasc) : null
  const initials  = getInitials(meta.nome)
  const pos       = posAbrev(meta.posicao)

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 14px', borderRadius: '10px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    color: 'white', fontSize: '16px', outline: 'none', fontFamily: 'system-ui, sans-serif',
    transition: 'border-color .2s, box-shadow .2s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: 'rgba(255,255,255,0.4)', marginBottom: '7px',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{ background: '#06100a', minHeight: '100dvh', fontFamily: 'system-ui, sans-serif', color: 'white', overscrollBehaviorY: 'none' }}>
      <style>{`
        @keyframes barGrow  { from{width:0} to{width:var(--w)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse {
          0%,100%{ box-shadow:0 0 0 2px rgba(0,255,136,0.15) }
          50%    { box-shadow:0 0 0 2px rgba(0,255,136,0.38), 0 0 24px rgba(0,255,136,0.12) }
        }
        @keyframes dotPulse {
          0%,100%{ opacity:1; transform:scale(1)  }
          50%    { opacity:.4; transform:scale(.65)}
        }
        .avaliacao-card { animation: fadeUp .45s ease forwards; }
        .action-btn {
          display:flex; align-items:center; gap:10px; padding:15px 18px; border-radius:14px;
          border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03);
          color:white; text-decoration:none; font-size:14px; font-weight:600;
          transition:border-color 0.2s,background 0.2s; cursor:pointer;
          min-height:52px;
        }
        .action-btn:hover  { border-color:rgba(34,197,94,0.3); background:rgba(34,197,94,0.05); }
        .action-btn:active { transform:scale(.98); opacity:.88; transition:transform .08s,opacity .08s; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
        select option { background:#0b1610; }
        textarea { resize:none; }
        textarea:focus,input:focus,select:focus { border-color:rgba(0,255,136,0.3) !important; outline:none; box-shadow:0 0 0 3px rgba(0,255,136,0.08) !important; }
        @keyframes revealUp {
          from { opacity:0; transform:translateY(8px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .traj-btn {
          display:flex; align-items:center; gap:14px; padding:15px 18px; border-radius:16px;
          border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.025);
          color:white; text-decoration:none; width:100%; box-sizing:border-box;
          transition:border-color .2s, background .2s;
          min-height:58px;
        }
        .traj-btn:hover  { border-color:rgba(0,255,136,0.28); background:rgba(0,255,136,0.04); }
        .traj-btn:active { transform:scale(.98); opacity:.9; transition:transform .08s,opacity .08s; }
        .share-btn {
          width:100%; padding:17px 18px; border-radius:14px;
          border:1.5px solid rgba(0,255,136,0.28); background:rgba(0,255,136,0.06);
          color:white; font-weight:700; font-size:15px; cursor:pointer;
          font-family:system-ui,sans-serif;
          display:flex; align-items:center; gap:12px;
          transition:border-color .2s, background .2s, box-shadow .2s;
          min-height:56px;
        }
        .share-btn:hover  { border-color:rgba(0,255,136,0.45); background:rgba(0,255,136,0.1); box-shadow:0 0 28px rgba(0,255,136,0.1); }
        .share-btn:active { transform:scale(.97); opacity:.9; transition:transform .08s,opacity .08s; }
        .passo-item {
          display:flex; align-items:center; gap:14px; padding:15px 16px;
          border-radius:14px; transition:border-color .2s, background .2s;
        }
        .passo-item:active { transform:scale(.99); opacity:.9; }
        @keyframes hlReveal {
          from { opacity:0; transform:translateY(8px) }
          to   { opacity:1; transform:translateY(0) }
        }
        .hl-card { animation: hlReveal .35s ease forwards; }
        .hl-del-btn {
          background:none; border:none; cursor:pointer; padding:6px 8px; border-radius:8px;
          color:rgba(255,255,255,0.22); font-size:14px; line-height:1;
          transition:color .15s, background .15s;
        }
        .hl-del-btn:hover { color:#ef4444; background:rgba(239,68,68,0.1); }
        .hl-add-input {
          width:100%; padding:11px 14px; border-radius:10px; box-sizing:border-box;
          background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);
          color:white; font-size:16px; outline:none; font-family:system-ui,sans-serif;
          transition:border-color .2s;
        }
        .hl-add-input:focus { border-color:rgba(0,255,136,0.3); }
        .hl-add-input::placeholder { color:rgba(255,255,255,0.2); }
        .hl-add-input:focus { border-color:rgba(0,255,136,0.3); box-shadow:0 0 0 3px rgba(0,255,136,0.08); }
        /* Save button */
        button[type=submit]:active { transform:scale(.98); opacity:.88; transition:transform .08s; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{ padding:'16px 24px', paddingTop:'calc(16px + env(safe-area-inset-top))', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
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

      <div style={{ maxWidth:'480px', margin:'0 auto', padding:'28px 20px', paddingBottom:'calc(80px + env(safe-area-inset-bottom))' }}>

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

            {/* ── Identidade: exibição ou edição inline ── */}
            {editingId ? (
              <form onSubmit={handleSaveIdentidade} style={{ marginBottom:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                {/* Nome */}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <label style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Nome</label>
                  <input
                    value={editNome} onChange={e => setEditNome(e.target.value)}
                    required placeholder="Seu nome completo"
                    style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'10px', padding:'10px 14px', color:'white', fontSize:'14px', fontWeight:600, outline:'none' }}
                  />
                </div>
                {/* Posição */}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <label style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Posição</label>
                  <select
                    value={editPosicao} onChange={e => setEditPosicao(e.target.value)}
                    style={{ background:'#0e1a12', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'10px', padding:'10px 14px', color: editPosicao ? 'white' : 'rgba(255,255,255,0.35)', fontSize:'14px', outline:'none' }}
                  >
                    <option value="">Selecionar posição</option>
                    {['Goleiro','Lateral Direito','Lateral Esquerdo','Zagueiro','Volante','Meia','Meia-Atacante','Ponta Direita','Ponta Esquerda','Atacante','Centro-Avante'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                {/* Cidade */}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                  <label style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase' }}>Cidade</label>
                  <input
                    value={editCidade} onChange={e => setEditCidade(e.target.value)}
                    placeholder="Ex: São Paulo"
                    style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'10px', padding:'10px 14px', color:'white', fontSize:'14px', outline:'none' }}
                  />
                </div>
                {/* Ações */}
                <div style={{ display:'flex', gap:'8px', marginTop:'2px' }}>
                  <button type="submit" disabled={savingId}
                    style={{ flex:1, padding:'11px', borderRadius:'10px', cursor:'pointer', fontWeight:800, fontSize:'13px',
                      background: savedId ? 'rgba(34,197,94,0.2)' : '#22c55e',
                      color: savedId ? '#22c55e' : 'black',
                      border: savedId ? '1px solid rgba(34,197,94,0.4)' : 'none',
                    }}>
                    {savedId ? '✓ Salvo!' : savingId ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button type="button" onClick={() => setEditingId(false)}
                    style={{ padding:'11px 16px', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.12)', background:'transparent', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'13px', fontWeight:600 }}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
                  <div>
                    <h1 style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:800 }}>{meta.nome}</h1>
                    <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.4)' }}>
                      {meta.posicao}{meta.cidade ? ` · ${meta.cidade}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => { setEditNome(meta.nome); setEditPosicao(meta.posicao); setEditCidade(meta.cidade); setEditingId(true) }}
                    style={{ flexShrink:0, marginTop:'2px', padding:'6px 12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'12px', fontWeight:600 }}>
                    ✏️ Editar
                  </button>
                </div>
              </div>
            )}

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
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'24px' }}>
          {[
            { label:'Avaliações',    val: avaliacao ? '1' : '0',    sub:'registradas',    color:'#22c55e' },
            { label:'Visualizações', val: visitCount.toLocaleString('pt-BR'), sub:'no perfil', color:'#60a5fa' },
            { label:'Scouts',        val: favoritoCount > 0 ? favoritoCount.toLocaleString('pt-BR') : '—', sub:'salvaram você', color: favoritoCount > 0 ? '#fbbf24' : 'rgba(255,255,255,0.2)' },
          ].map(s => (
            <div key={s.label} style={{
              background:'#0b1610', border:'1px solid rgba(255,255,255,0.06)',
              borderRadius:'14px', padding:'14px 10px', textAlign:'center',
            }}>
              <p style={{ margin:'0 0 2px', fontSize:'20px', fontWeight:900, color: s.color }}>{s.val}</p>
              <p style={{ margin:'0 0 2px', fontSize:'9px', fontWeight:700, color:'white', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
              <p style={{ margin:0, fontSize:'9px', color:'rgba(255,255,255,0.25)' }}>{s.sub}</p>
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
                color: notaColor(avaliacao.scout_score),
                textShadow:`0 0 16px ${notaColor(avaliacao.scout_score)}55`,
              }}>
                {avaliacao.scout_score}
              </span>
              <span style={{ fontSize:'8px', fontWeight:700, color:'rgba(255,255,255,0.28)', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                nota
              </span>
            </div>
          </div>
        )}

        {/* ── Carta de Avaliação ── */}
        <Link href="/atleta/carta" className="traj-btn" style={{ marginBottom:'12px', display:'flex', borderColor:'rgba(0,255,136,0.2)', background:'rgba(0,255,136,0.03)' }}>
          <div style={{
            width:'40px', height:'40px', borderRadius:'12px', flexShrink:0,
            background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px',
          }}>
            ⚽
          </div>
          <div style={{ flex:1 }}>
            <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'#00FF88' }}>
              Carta de Avaliação
            </p>
            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>
              Card oficial com OVR · R$ 5,00 · acesso permanente
            </p>
          </div>
          <span style={{ color:'rgba(0,255,136,0.4)', fontSize:'18px', flexShrink:0, alignSelf:'center' }}>›</span>
        </Link>

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
                  color: notaColor(avaliacao.scout_score),
                  textShadow:`0 0 20px ${notaColor(avaliacao.scout_score)}55`,
                }}>
                  {avaliacao.scout_score}
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
                <AtributoBar icon="⚡" label="Velocidade"    value={avaliacao.velocidade * 10} />
                <AtributoBar icon="👁" label="Visão de Jogo" value={avaliacao.visao_jogo * 10} />
                <AtributoBar icon="💪" label="Força Física"  value={avaliacao.forca * 10} />
                <AtributoBar icon="🎯" label="Finalização"   value={avaliacao.finalizacao * 10} />
                <AtributoBar icon="🧠" label="Int. Tática"   value={avaliacao.posicionamento * 10} />
                <AtributoBar icon="⚽" label="Técnica"       value={avaliacao.tecnica * 10} />
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

            {/* ── Contato ── */}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:'18px' }}>
              <label style={labelStyle}>📱 Telefone / WhatsApp</label>
              <input
                type="tel" value={curriculo.telefone}
                onChange={e => setCurriculo(c => ({ ...c, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
                style={inputStyle}
              />
              <p style={{ margin:'5px 0 0', fontSize:'11px', color:'rgba(0,255,136,0.4)' }}>
                +5 OVR ao preencher
              </p>
            </div>

            {/* ── Clubes anteriores ── */}
            <div>
              <label style={labelStyle}>🏟 Clubes que já joguei</label>
              <textarea
                value={curriculo.clubesAnteriores}
                onChange={e => setCurriculo(c => ({ ...c, clubesAnteriores: e.target.value }))}
                placeholder="Ex: Flamengo Sub-15, Vasco Sub-17, América FC..."
                rows={2}
                style={{ ...inputStyle, lineHeight:1.55 }}
              />
              <p style={{ margin:'5px 0 0', fontSize:'11px', color:'rgba(0,255,136,0.4)' }}>
                +15 OVR ao preencher
              </p>
            </div>

            {/* ── Campeonatos ── */}
            <div>
              <label style={labelStyle}>🏆 Campeonatos disputados</label>
              <textarea
                value={curriculo.campeonatos}
                onChange={e => setCurriculo(c => ({ ...c, campeonatos: e.target.value }))}
                placeholder="Ex: Campeonato Carioca Sub-15 2023, Copa do Brasil Sub-17..."
                rows={2}
                style={{ ...inputStyle, lineHeight:1.55 }}
              />
              <p style={{ margin:'5px 0 0', fontSize:'11px', color:'rgba(0,255,136,0.4)' }}>
                +10 OVR ao preencher
              </p>
            </div>

            {/* ── Títulos ── */}
            <div>
              <label style={labelStyle}>🥇 Títulos conquistados</label>
              <textarea
                value={curriculo.titulos}
                onChange={e => setCurriculo(c => ({ ...c, titulos: e.target.value }))}
                placeholder="Ex: Campeão Estadual Sub-15 2023, Vice-campeão Copa São Paulo..."
                rows={2}
                style={{ ...inputStyle, lineHeight:1.55 }}
              />
              <p style={{ margin:'5px 0 0', fontSize:'11px', color:'rgba(0,255,136,0.4)' }}>
                +10 OVR ao preencher
              </p>
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
              minHeight:'48px',
              opacity:saving ? 0.7 : 1, transition:'background 0.2s', marginBottom:'24px',
            }}
          >
            {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar currículo'}
          </button>
        </form>

        {/* ══════════════════════════════════════════
            HIGHLIGHTS — vídeos via link
        ══════════════════════════════════════════ */}
        <div style={{ marginBottom:'24px' }}>

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <div>
              <p style={{ margin:'0 0 2px', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                Highlights
              </p>
              <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>
                {highlights.length === 0 ? 'Seus melhores momentos em campo' : `${highlights.length} vídeo${highlights.length > 1 ? 's' : ''} adicionado${highlights.length > 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => { setShowAddHL(v => !v); setHlUrl(''); setHlParsed(null); setHlError(null) }}
              style={{
                padding:'7px 14px', borderRadius:'10px', border:'1px solid rgba(0,255,136,0.3)',
                background: showAddHL ? 'rgba(0,255,136,0.12)' : 'rgba(0,255,136,0.06)',
                color:'#00FF88', fontWeight:700, fontSize:'13px', cursor:'pointer',
                fontFamily:'system-ui,sans-serif',
              }}
            >
              {showAddHL ? '✕ Cancelar' : '＋ Adicionar'}
            </button>
          </div>

          {/* Formulário de adição */}
          {showAddHL && (
            <div style={{
              marginBottom:'14px', padding:'16px', borderRadius:'16px',
              background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.18)',
              animation:'revealUp .3s ease forwards',
            }}>
              <p style={{ margin:'0 0 10px', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.35)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                Cole o link do vídeo
              </p>
              <input
                className="hl-add-input"
                type="url"
                value={hlUrl}
                onChange={e => handleHlUrlChange(e.target.value)}
                placeholder="YouTube, TikTok, Instagram ou Vimeo…"
                autoFocus
              />

              {/* Platform detection badge */}
              {hlParsed && (
                <div style={{
                  marginTop:'8px', display:'inline-flex', alignItems:'center', gap:'6px',
                  padding:'4px 10px', borderRadius:'100px',
                  background: getPlatformInfo(hlParsed.plataforma).bg + '22',
                  border:`1px solid ${getPlatformInfo(hlParsed.plataforma).bg}44`,
                }}>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: getPlatformInfo(hlParsed.plataforma).bg }} />
                  <span style={{ fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.6)' }}>
                    {getPlatformInfo(hlParsed.plataforma).label} detectado
                  </span>
                </div>
              )}

              {hlError && (
                <p style={{ margin:'8px 0 0', fontSize:'12px', color:'#f87171' }}>{hlError}</p>
              )}

              <button
                onClick={handleAddHL}
                disabled={addingHL || !hlParsed}
                style={{
                  marginTop:'12px', width:'100%', padding:'11px', borderRadius:'10px', border:'none',
                  background: hlParsed ? '#00FF88' : 'rgba(255,255,255,0.1)',
                  color: hlParsed ? '#020d04' : 'rgba(255,255,255,0.25)',
                  fontWeight:800, fontSize:'14px',
                  cursor: (addingHL || !hlParsed) ? 'not-allowed' : 'pointer',
                  fontFamily:'system-ui,sans-serif',
                  opacity: addingHL ? 0.7 : 1,
                }}
              >
                {addingHL ? 'Adicionando…' : 'Adicionar highlight →'}
              </button>
            </div>
          )}

          {/* Cards de highlights */}
          {highlights.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {highlights.map(hl => {
                const thumb = getThumbnail(hl)
                const platform = getPlatformInfo(hl.plataforma)
                const isPlaying = playingHlId === hl.id
                const isDeleting = deletingHlId === hl.id

                return (
                  <div key={hl.id} className="hl-card" style={{
                    borderRadius:'16px', overflow:'hidden',
                    background:'#0b1610', border:'1px solid rgba(255,255,255,0.08)',
                  }}>
                    {/* Thumbnail / embed area — 16:9 */}
                    <div style={{ position:'relative', aspectRatio:'16/9', background:'#0a120e', cursor:'pointer' }}
                      onClick={() => !isPlaying && setPlayingHlId(hl.id)}
                    >
                      {isPlaying ? (
                        <iframe
                          src={getEmbedUrl(hl.plataforma, hl.video_id)}
                          style={{ width:'100%', height:'100%', border:'none' }}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <>
                          {thumb ? (
                            <img src={thumb} alt={hl.titulo ?? platform.label} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                          ) : (
                            <div style={{
                              width:'100%', height:'100%',
                              background:`linear-gradient(135deg,${platform.bg}22,rgba(0,0,0,0.6))`,
                              display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'6px',
                            }}>
                              <div style={{
                                width:'42px', height:'42px', borderRadius:'50%',
                                background: platform.bg,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:'20px',
                              }}>
                                ▶
                              </div>
                              <span style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.5)' }}>{platform.label}</span>
                            </div>
                          )}
                          {/* Play overlay */}
                          <div style={{
                            position:'absolute', inset:0,
                            display:'flex', alignItems:'center', justifyContent:'center',
                            background:'rgba(0,0,0,0.25)',
                          }}>
                            <div style={{
                              width:'48px', height:'48px', borderRadius:'50%',
                              background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              border:'1.5px solid rgba(255,255,255,0.25)',
                            }}>
                              <span style={{ fontSize:'18px', marginLeft:'3px' }}>▶</span>
                            </div>
                          </div>
                          {/* Platform badge */}
                          <div style={{
                            position:'absolute', top:'8px', left:'8px',
                            padding:'3px 8px', borderRadius:'100px',
                            background: platform.bg,
                          }}>
                            <span style={{ fontSize:'9px', fontWeight:800, color:'white', letterSpacing:'0.05em' }}>{platform.label}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', gap:'10px' }}>
                      <p style={{ margin:0, flex:1, fontSize:'12px', fontWeight:600, color:'rgba(255,255,255,0.5)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {hl.titulo ?? platform.label}
                      </p>
                      <a href={hl.url} target="_blank" rel="noreferrer"
                        style={{ fontSize:'13px', color:'rgba(255,255,255,0.22)', textDecoration:'none', flexShrink:0 }}
                        title="Abrir original"
                      >
                        ↗
                      </a>
                      <button
                        className="hl-del-btn"
                        onClick={() => handleDeleteHL(hl.id)}
                        disabled={isDeleting}
                        title="Remover highlight"
                      >
                        {isDeleting ? '…' : '✕'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Empty state */}
          {highlights.length === 0 && !showAddHL && (
            <div style={{
              padding:'20px', borderRadius:'16px',
              background:'rgba(255,255,255,0.02)', border:'1px dashed rgba(255,255,255,0.1)',
              textAlign:'center',
            }}>
              <p style={{ margin:'0 0 6px', fontSize:'20px' }}>🎬</p>
              <p style={{ margin:'0 0 4px', fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.45)' }}>
                Nenhum highlight ainda
              </p>
              <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.2)', lineHeight:1.6 }}>
                Cole links do YouTube, TikTok, Instagram ou Vimeo
              </p>
            </div>
          )}
        </div>

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
      <AtletaBottomNav />

      {/* ── Banner questionário concluído ── */}
      {showQuestBanner && (
        <div style={{
          position: 'fixed', bottom: 88, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, width: 'calc(100% - 40px)', maxWidth: 380,
          background: 'linear-gradient(135deg,#00c864,#00FF88)',
          borderRadius: 16, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,255,136,0.4)',
          animation: 'fadeUp .3s ease forwards',
        }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#020d04' }}>
              Questionário concluído!
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>
              Seu OVR foi atualizado com os novos pontos
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

export default function AtletaPerfilPage() {
  return (
    <Suspense fallback={
      <main style={{ background:'#020d04', minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(0,255,136,0.15)', borderTopColor:'#00FF88', animation:'spin .8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </main>
    }>
      <AtletaPerfilContent />
    </Suspense>
  )
}