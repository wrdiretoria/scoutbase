'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function calcularOVR(nome: string): number {
  const hash = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 68 + (hash % 13)
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

// ── Tipos ─────────────────────────────────────────────────────────────────────

type AtletaMeta = { nome: string; posicao: string; cidade: string; tipo: string }

type Curriculo = {
  bio: string
  altura: string
  peso: string
  peDominante: string
  clubeAtual: string
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AtletaPerfilPage() {
  const router  = useRouter()
  const [meta,      setMeta]      = useState<AtletaMeta | null>(null)
  const [dataNasc,  setDataNasc]  = useState<string | null>(null)
  const [uid,       setUid]       = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  const [curriculo, setCurriculo] = useState<Curriculo>({
    bio: '', altura: '', peso: '', peDominante: '', clubeAtual: '',
  })
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('data_nascimento, bio, altura, peso, pe_dominante, clube_atual')
        .eq('id', user.id)
        .single()

      if (profile?.data_nascimento) setDataNasc(profile.data_nascimento as string)

      setCurriculo({
        bio:         (profile?.bio          as string)  ?? '',
        altura:      profile?.altura        != null ? String(profile.altura) : '',
        peso:        profile?.peso          != null ? String(profile.peso)   : '',
        peDominante: (profile?.pe_dominante as string)  ?? '',
        clubeAtual:  (profile?.clube_atual  as string)  ?? '',
      })

      setLoading(false)
    }
    load()
  }, [router])

  // ── Progresso ────────────────────────────────────────────────
  function calcularProgresso(): number {
    let pts = 20 // perfil criado
    if (dataNasc) pts += 10
    if (curriculo.bio.trim())       pts += 20
    const temFisico = curriculo.altura && curriculo.peso && curriculo.peDominante
    if (temFisico) pts += 20
    if (curriculo.clubeAtual.trim()) pts += 15
    return Math.min(pts, 85)
  }

  // ── Salvar ───────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!uid) return
    setSaving(true)
    setSaveErr(null)
    setSaved(false)

    const res = await fetch('/api/atleta/salvar-curriculo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId:     uid,
        bio:        curriculo.bio.trim(),
        altura:     curriculo.altura ? Number(curriculo.altura) : null,
        peso:       curriculo.peso   ? Number(curriculo.peso)   : null,
        peDominante: curriculo.peDominante,
        clubeAtual: curriculo.clubeAtual.trim(),
      }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setSaveErr('Não foi possível salvar. Tente novamente.')
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <main style={{ background: '#06100a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui' }}>Carregando perfil…</p>
      </main>
    )
  }

  if (!meta) return null

  const ovr       = calcularOVR(meta.nome)
  const categoria = dataNasc ? calcularCategoria(dataNasc) : null
  const initials  = getInitials(meta.nome)
  const pos       = posAbrev(meta.posicao)
  const progresso = calcularProgresso()

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

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
    }}>
      <style>{`
        @keyframes barGrow { from { width:0 } to { width:${progresso}% } }
        .prog-bar { animation: barGrow 1s ease forwards 0.3s; width: 0; }
        .action-btn {
          display:flex; align-items:center; gap:10px;
          padding:14px 18px; border-radius:14px;
          border:1px solid rgba(255,255,255,0.08);
          background:rgba(255,255,255,0.03);
          color:white; text-decoration:none; font-size:14px; font-weight:600;
          transition: border-color 0.2s, background 0.2s; cursor: pointer;
        }
        .action-btn:hover { border-color:rgba(34,197,94,0.3); background:rgba(34,197,94,0.05); }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        select option { background: #0b1610; }
      `}</style>

      {/* Nav */}
      <nav style={{
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.03em' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </Link>
        <button
          onClick={async () => { const s = createClient(); await s.auth.signOut(); router.push('/') }}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '13px', cursor: 'pointer' }}
        >
          Sair
        </button>
      </nav>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* ── Header card ── */}
        <div style={{
          borderRadius: '20px', overflow: 'hidden',
          background: '#0b1610', border: '1px solid rgba(34,197,94,0.15)',
          boxShadow: '0 0 40px rgba(34,197,94,0.1)',
          marginBottom: '16px',
        }}>
          <div style={{
            background: 'linear-gradient(160deg,#15803d 0%,#064e1e 100%)',
            padding: '20px 20px 0',
            display: 'flex', alignItems: 'flex-end', gap: '16px',
            minHeight: '100px', position: 'relative',
          }}>
            {categoria && (
              <div style={{
                position: 'absolute', top: '12px', right: '14px',
                background: 'rgba(0,0,0,0.4)', borderRadius: '20px',
                padding: '3px 10px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.8)',
              }}>
                {categoria}
              </div>
            )}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#15803d,#4ade80)',
              border: '3px solid #0b1610',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 900,
              boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
              marginBottom: '-20px',
            }}>
              {initials}
            </div>
            <div style={{ paddingBottom: '16px' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: 'white', letterSpacing: '-0.04em' }}>{ovr}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginLeft: '6px' }}>{pos}</span>
            </div>
          </div>

          <div style={{ padding: '28px 20px 20px' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>{meta.nome}</h1>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {meta.posicao}{meta.cidade ? ` · ${meta.cidade}` : ''}
            </p>

            {/* Progresso */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Currículo completo
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e' }}>{progresso}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                <div className="prog-bar" style={{ height: '100%', background: 'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius: '2px' }} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                {progresso < 50 ? 'Preencha o currículo abaixo para subir no ranking.' :
                 progresso < 75 ? 'Quase lá — mais alguns detalhes e seu perfil se destaca.' :
                 'Perfil forte! Scout verá você do jeito certo.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px', marginBottom: '24px',
        }}>
          {[
            { label: 'OVR', val: String(ovr), sub: 'geral' },
            { label: 'Ranking', val: '—', sub: 'aguardando' },
            { label: 'Avaliações', val: '0', sub: 'registradas' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#0b1610', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '14px', padding: '14px 12px', textAlign: 'center',
            }}>
              <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 900, color: '#22c55e' }}>{s.val}</p>
              <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            CURRÍCULO EDITÁVEL
        ══════════════════════════════════════════ */}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Meu currículo
            </p>
            <Link
              href={uid ? `/jogador/${uid}` : '#'}
              target="_blank"
              style={{ fontSize: '12px', color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}
            >
              Ver perfil público →
            </Link>
          </div>

          <div style={{
            background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '18px', padding: '22px 18px',
            display: 'flex', flexDirection: 'column', gap: '20px',
            marginBottom: '12px',
          }}>

            {/* Apresentação */}
            <div>
              <label style={labelStyle}>Apresentação</label>
              <textarea
                value={curriculo.bio}
                onChange={e => setCurriculo(c => ({ ...c, bio: e.target.value }))}
                placeholder="Conte quem você é como atleta. Seu estilo de jogo, pontos fortes, o que te move..."
                maxLength={280}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'none', lineHeight: 1.55,
                }}
              />
              <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'right' }}>
                {curriculo.bio.length}/280
              </p>
            </div>

            {/* Clube atual */}
            <div>
              <label style={labelStyle}>Clube atual</label>
              <input
                type="text"
                value={curriculo.clubeAtual}
                onChange={e => setCurriculo(c => ({ ...c, clubeAtual: e.target.value }))}
                placeholder="Ex: EC Flamengo Sub-15, sem clube no momento..."
                style={inputStyle}
              />
            </div>

            {/* Dados físicos */}
            <div>
              <label style={labelStyle}>Dados físicos</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '10px' }}>
                <div>
                  <input
                    type="number"
                    value={curriculo.altura}
                    onChange={e => setCurriculo(c => ({ ...c, altura: e.target.value }))}
                    placeholder="Altura"
                    min={100} max={230}
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>cm</p>
                </div>
                <div>
                  <input
                    type="number"
                    value={curriculo.peso}
                    onChange={e => setCurriculo(c => ({ ...c, peso: e.target.value }))}
                    placeholder="Peso"
                    min={30} max={150}
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>kg</p>
                </div>
                <div>
                  <select
                    value={curriculo.peDominante}
                    onChange={e => setCurriculo(c => ({ ...c, peDominante: e.target.value }))}
                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', textAlign: 'center' }}
                  >
                    <option value="">Pé</option>
                    <option value="Direito">Direito</option>
                    <option value="Esquerdo">Esquerdo</option>
                    <option value="Ambidestro">Ambidestro</option>
                  </select>
                  <p style={{ margin: '4px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>dominante</p>
                </div>
              </div>
            </div>

            {/* ── Premium locked ── */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '18px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Premium — em breve
              </p>
              {[
                { icon: '🎬', label: 'Vídeo destaque', desc: 'Seus melhores momentos em campo' },
                { icon: '📊', label: 'Estatísticas da temporada', desc: 'Gols, assistências, jogos disputados' },
                { icon: '✅', label: 'Badge verificado', desc: 'Selo que scouts e clubes confiam' },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  opacity: 0.55,
                  userSelect: 'none',
                }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'white' }}>{item.label}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{item.desc}</p>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '6px', padding: '3px 8px', flexShrink: 0,
                  }}>🔒 PRO</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botão salvar */}
          {saveErr && (
            <p style={{ margin: '0 0 10px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '13px', color: '#f87171' }}>
              {saveErr}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              background: saved ? '#16a34a' : '#22c55e',
              color: 'black', fontWeight: 800, fontSize: '15px',
              opacity: saving ? 0.7 : 1,
              transition: 'background 0.2s',
              marginBottom: '24px',
            }}
          >
            {saving ? 'Salvando…' : saved ? '✓ Salvo!' : 'Salvar currículo'}
          </button>
        </form>

        {/* ── Ações ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="action-btn"
            onClick={() => {
              const cardUrl = uid
                ? `https://scoutbase-eta.vercel.app/jogador/${uid}`
                : 'https://scoutbase-eta.vercel.app'
              if (navigator.share) {
                navigator.share({
                  title: `${meta.nome} · OVR ${ovr} · MeuCraque`,
                  text: `Acabei de montar meu currículo no MeuCraque! OVR ${ovr} · ${meta.posicao} · ${meta.cidade}. Você é o próximo?`,
                  url: cardUrl,
                })
              } else {
                navigator.clipboard.writeText(cardUrl)
                alert('Link copiado!')
              }
            }}
            style={{
              background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px',
              color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%',
            }}
          >
            <span>📲</span> Compartilhar meu perfil
          </button>

          <Link href="/ranking" className="action-btn" style={{ justifyContent: 'center', textAlign: 'center' }}>
            Ver ranking geral →
          </Link>
        </div>
      </div>
    </main>
  )
}
