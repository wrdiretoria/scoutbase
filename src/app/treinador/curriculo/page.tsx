'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'

const ESPECIALIDADES = [
  'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto',
  'Preparação Física', 'Goleiros', 'Polivalente',
]

async function compressImage(file: File, maxPx = 900, quality = 0.82): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width * ratio), h = Math.round(img.height * ratio)
      const cv = document.createElement('canvas')
      cv.width = w; cv.height = h
      cv.getContext('2d')!.drawImage(img, 0, 0, w, h)
      cv.toBlob(b => resolve(b ?? file), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      overflow: 'hidden',
      marginBottom: '14px',
    }}>
      <div style={{
        padding: '14px 18px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 800,
          color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          {titulo}
        </span>
      </div>
      <div style={{ padding: '18px' }}>
        {children}
      </div>
    </div>
  )
}

// ── Field ──────────────────────────────────────────────────────────────────────

function Campo({
  label, hint, prefix, children,
}: {
  label: string
  hint?: string
  prefix?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
        }}>
          {label}
        </label>
        {hint && (
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{hint}</span>
        )}
      </div>
      {prefix ? (
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.35)', fontSize: '15px', fontWeight: 700,
            pointerEvents: 'none',
          }}>{prefix}</span>
          <div style={{ paddingLeft: '34px' }}>{children}</div>
        </div>
      ) : children}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TreinadorCurriculoPage() {
  const router  = useRouter()
  const fotoRef = useRef<HTMLInputElement>(null)

  const [userId,     setUserId]     = useState('')
  const [nome,       setNome]       = useState('')
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveErr,    setSaveErr]    = useState<string | null>(null)
  const [uploading,  setUploading]  = useState(false)

  // fields
  const [avatarUrl,         setAvatarUrl]         = useState<string | null>(null)
  const [fotoPreview,       setFotoPreview]       = useState<string | null>(null)
  const [fotoFile,          setFotoFile]          = useState<File | null>(null)
  const [especialidade,     setEspec]             = useState('')
  const [cidade,            setCidade]            = useState('')
  const [anosExp,           setAnosExp]           = useState('')
  const [bio,               setBio]               = useState('')
  const [clubesTrabalhados, setClubesTrabalhados] = useState('')
  const [certificacoes,     setCertificacoes]     = useState('')
  const [conquistas,        setConquistas]        = useState('')
  const [instagram,         setInstagram]         = useState('')
  const [tiktok,            setTiktok]            = useState('')
  const [youtube,           setYoutube]           = useState('')
  const [outras,            setOutras]            = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setUserId(user.id)
      setNome(user.user_metadata?.nome ?? 'Treinador')

      const { data: profile } = await supabase
        .from('profiles')
        .select('bio, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        const p = profile as Record<string, unknown>
        if (p.bio)        setBio(p.bio as string)
        if (p.avatar_url) setAvatarUrl(p.avatar_url as string)
      }

      const meta = (user.user_metadata ?? {}) as Record<string, unknown>
      if (meta.especialidade)      setEspec(meta.especialidade as string)
      if (meta.cidade)             setCidade(meta.cidade as string)
      if (meta.anos_exp)           setAnosExp(meta.anos_exp as string)
      if (meta.clubes_trabalhados) setClubesTrabalhados(meta.clubes_trabalhados as string)
      if (meta.certificacoes)      setCertificacoes(meta.certificacoes as string)
      if (meta.conquistas)         setConquistas(meta.conquistas as string)
      if (meta.instagram)          setInstagram(meta.instagram as string)
      if (meta.tiktok)             setTiktok(meta.tiktok as string)
      if (meta.youtube)            setYoutube(meta.youtube as string)
      if (meta.outras)             setOutras(meta.outras as string)

      setLoading(false)
    }
    init()
  }, [router])

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadFoto(): Promise<string | null> {
    if (!fotoFile) return null
    setUploading(true)
    try {
      const compressed = await compressImage(fotoFile)
      const fd = new FormData()
      fd.append('file', new File([compressed], 'photo.jpg', { type: 'image/jpeg' }))
      const res  = await fetch('/api/atleta/upload-foto', { method: 'POST', body: fd })
      const json = await res.json() as { url?: string }
      return json.url ?? null
    } catch { return null }
    finally { setUploading(false) }
  }

  async function handleSalvar() {
    setSaving(true)
    setSaveErr(null)
    setSaved(false)

    try {
      let url = avatarUrl
      if (fotoFile) {
        url = await uploadFoto()
        if (url) setAvatarUrl(url)
      }

      const res = await fetch('/api/treinador/salvar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          avatarUrl:        url,
          bio:              bio.trim()               || null,
          especialidade:    especialidade            || null,
          cidade:           cidade.trim()            || null,
          anosExp:          anosExp.trim()           || null,
          clubesTrabalhados:clubesTrabalhados.trim() || null,
          certificacoes:    certificacoes.trim()     || null,
          conquistas:       conquistas.trim()        || null,
          instagram:        instagram.replace(/^@/, '').trim() || null,
          tiktok:           tiktok.replace(/^@/, '').trim()    || null,
          youtube:          youtube.replace(/^@/, '').trim()   || null,
          outras:           outras.trim()            || null,
        }),
      })

      const json = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Erro ao salvar.')

      setSaved(true)
      setFotoFile(null)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setSaveErr(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────────

  const inp: React.CSSProperties = {
    width: '100%', padding: '13px 14px', borderRadius: '11px', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    color: 'white', fontSize: '15px', outline: 'none',
    fontFamily: 'system-ui, sans-serif', transition: 'border-color .2s',
  }
  const inpPfx: React.CSSProperties = { ...inp, paddingLeft: '34px' }

  if (loading) {
    return (
      <main style={{ background: '#030a05', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.08)', borderTopColor: '#fbbf24', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      </main>
    )
  }

  const foto  = fotoPreview ?? avatarUrl
  const inits = getInitials(nome)

  return (
    <main style={{
      background: '#030a05', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 20px',
      paddingTop: 'max(24px, env(safe-area-inset-top))',
      paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(251,191,36,0.45) !important;
          box-shadow: 0 0 0 3px rgba(251,191,36,0.07) !important;
        }
        .cur-fade { animation: fadeUp .4s ease forwards; }
        .cur-save {
          width:100%; padding:16px; border-radius:14px; border:none;
          background: linear-gradient(135deg,#d97706,#f59e0b 55%,#fbbf24);
          color:#1c0a00; font-weight:900; font-size:16px; cursor:pointer;
          font-family:system-ui,sans-serif; letter-spacing:.02em;
          box-shadow:0 0 28px rgba(251,191,36,0.28), 0 4px 16px rgba(0,0,0,0.4);
          transition:opacity .15s, transform .1s;
          min-height:54px;
        }
        .cur-save:disabled { opacity:.5; cursor:not-allowed; }
        .cur-save:active   { opacity:.88; transform:scale(.98); }
      `}</style>

      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* ── Header ── */}
        <div className="cur-fade" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '28px',
        }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: 'rgba(255,255,255,0.35)', fontWeight: 600,
              fontFamily: 'system-ui', padding: 0,
            }}
          >
            ← Voltar
          </button>
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>
            ✏ Currículo
          </span>
          <div style={{ width: 60 }} />
        </div>

        {/* ════════════════════════════════════
            FOTO
        ════════════════════════════════════ */}
        <div className="cur-fade" style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <label htmlFor="curriculo-foto" style={{
            display: 'block', width: '96px', height: '96px', borderRadius: '50%',
            overflow: 'hidden', cursor: uploading ? 'wait' : 'pointer', position: 'relative',
            border: foto ? '3px solid rgba(251,191,36,0.55)' : '2px dashed rgba(255,255,255,0.18)',
            boxShadow: foto ? '0 0 32px rgba(251,191,36,0.2)' : 'none',
            transition: 'border-color .2s',
          }}>
            <input
              id="curriculo-foto" ref={fotoRef} type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
              onChange={handleFotoChange}
            />
            {foto ? (
              <img src={foto} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(145deg,#78350f,#d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '28px', fontWeight: 900, color: 'white',
              }}>
                {inits}
              </div>
            )}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: uploading ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background .2s',
            }}>
              <span style={{ fontSize: '18px' }}>{uploading ? '⏳' : '📷'}</span>
            </div>
          </label>
        </div>

        {/* ════════════════════════════════════
            IDENTIDADE
        ════════════════════════════════════ */}
        <Secao titulo="🏅 Identidade profissional">

          <Campo label="Especialidade">
            <select
              value={especialidade}
              onChange={e => setEspec(e.target.value)}
              style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
            >
              <option value="" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }}>Selecione...</option>
              {ESPECIALIDADES.map(e => (
                <option key={e} value={e} style={{ background: '#1a1a1a', color: 'white' }}>{e}</option>
              ))}
            </select>
          </Campo>

          <Campo label="Cidade" hint="opcional">
            <input
              type="text" value={cidade}
              onChange={e => setCidade(e.target.value)}
              placeholder="Ex: São Paulo – SP"
              style={inp}
            />
          </Campo>

          <Campo label="Anos de experiência" hint="opcional" >
            <input
              type="number" value={anosExp} min="0" max="50"
              onChange={e => setAnosExp(e.target.value)}
              placeholder="Ex: 8"
              style={{ ...inp, width: '100px' }}
            />
          </Campo>

        </Secao>

        {/* ════════════════════════════════════
            APRESENTAÇÃO
        ════════════════════════════════════ */}
        <Secao titulo="📝 Apresentação">

          <Campo label="Bio profissional" hint="opcional">
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Treinador de futebol com foco em desenvolvimento de jovens talentos..."
              maxLength={400}
              rows={5}
              style={{ ...inp, resize: 'vertical', minHeight: '120px', lineHeight: '1.6' }}
            />
            <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'right' }}>
              {bio.length}/400
            </p>
          </Campo>

        </Secao>

        {/* ════════════════════════════════════
            HISTÓRICO
        ════════════════════════════════════ */}
        <Secao titulo="📋 Histórico">

          <Campo label="Clubes e escolas onde trabalhou" hint="opcional">
            <textarea
              value={clubesTrabalhados}
              onChange={e => setClubesTrabalhados(e.target.value)}
              placeholder="Ex: Escolinha Futuro Craque (2019–2022), Clube Atlético Jovem (2022–atual)..."
              rows={4}
              style={{ ...inp, resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
            />
          </Campo>

          <Campo label="Certificações e cursos" hint="opcional">
            <textarea
              value={certificacoes}
              onChange={e => setCertificacoes(e.target.value)}
              placeholder="Ex: Licença C CBF (2021), Curso de Preparação Física Infantil (2020)..."
              rows={3}
              style={{ ...inp, resize: 'vertical', minHeight: '80px', lineHeight: '1.6' }}
            />
          </Campo>

          <Campo label="Conquistas como treinador" hint="opcional">
            <textarea
              value={conquistas}
              onChange={e => setConquistas(e.target.value)}
              placeholder="Ex: Campeão Municipal Sub-15 (2021), Melhor Treinador do Campeonato (2022)..."
              rows={3}
              style={{ ...inp, resize: 'vertical', minHeight: '80px', lineHeight: '1.6', marginBottom: 0 }}
            />
          </Campo>

        </Secao>

        {/* ════════════════════════════════════
            REDES SOCIAIS
        ════════════════════════════════════ */}
        <Secao titulo="📲 Redes sociais">

          <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
            Tudo opcional · só o @usuário, sem link completo
          </p>

          {[
            { label: 'Instagram', value: instagram, set: setInstagram, placeholder: 'seu.usuario' },
            { label: 'TikTok',    value: tiktok,    set: setTiktok,    placeholder: 'seu.usuario' },
            { label: 'YouTube',   value: youtube,   set: setYoutube,   placeholder: 'seucanal'    },
          ].map(({ label, value, set, placeholder }) => (
            <Campo key={label} label={label} hint="opcional">
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.35)', fontSize: '15px', fontWeight: 700,
                  pointerEvents: 'none',
                }}>@</span>
                <input
                  type="text" value={value}
                  onChange={e => set(e.target.value.replace(/^@/, ''))}
                  placeholder={placeholder}
                  autoCapitalize="none"
                  style={inpPfx}
                />
              </div>
            </Campo>
          ))}

          <Campo label="Outras" hint="opcional">
            <input
              type="text" value={outras}
              onChange={e => setOutras(e.target.value)}
              placeholder="Site, LinkedIn, outro link..."
              style={inp}
            />
          </Campo>

        </Secao>

        {/* ════════════════════════════════════
            SALVAR
        ════════════════════════════════════ */}
        <div style={{ marginTop: '8px' }}>
          {saveErr && (
            <p style={{
              margin: '0 0 12px', padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              fontSize: '13px', color: '#f87171', lineHeight: 1.5,
            }}>
              {saveErr}
            </p>
          )}

          <button className="cur-save" onClick={handleSalvar} disabled={saving || uploading}>
            {saving || uploading
              ? 'Salvando...'
              : saved
              ? '✓ Salvo com sucesso!'
              : '💾 Salvar currículo'}
          </button>

          {saved && (
            <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'rgba(0,255,136,0.6)', textAlign: 'center', fontWeight: 600 }}>
              Perfil atualizado ✓
            </p>
          )}
        </div>

      </div>

      <TreinadorBottomNav />
    </main>
  )
}
