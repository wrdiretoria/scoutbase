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

type AtletaMeta = {
  nome: string
  posicao: string
  cidade: string
  tipo: string
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AtletaPerfilPage() {
  const router = useRouter()
  const [meta, setMeta] = useState<AtletaMeta | null>(null)
  const [dataNasc, setDataNasc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) { router.push('/login'); return }

      const m = user.user_metadata as Partial<AtletaMeta>
      if (m?.tipo !== 'atleta') { router.push('/dashboard'); return }

      setMeta({
        nome:    m.nome    ?? 'Atleta',
        posicao: m.posicao ?? '',
        cidade:  m.cidade  ?? '',
        tipo:    'atleta',
      })

      // Busca data de nascimento do profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('data_nascimento')
        .eq('id', user.id)
        .single()

      if (profile?.data_nascimento) setDataNasc(profile.data_nascimento)
      setLoading(false)
    }
    load()
  }, [router])

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

  // Progresso do perfil (foto e treinador fazem subir depois)
  const progresso = 45

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
          transition: border-color 0.2s, background 0.2s;
          cursor: pointer;
        }
        .action-btn:hover { border-color:rgba(34,197,94,0.3); background:rgba(34,197,94,0.05); }
      `}</style>

      {/* Nav topo */}
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

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* ── Header card ── */}
        <div style={{
          borderRadius: '20px', overflow: 'hidden',
          background: '#0b1610', border: '1px solid rgba(34,197,94,0.15)',
          boxShadow: '0 0 40px rgba(34,197,94,0.1)',
          marginBottom: '16px',
        }}>
          {/* Topo colorido */}
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
            {/* Avatar */}
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
            {/* OVR */}
            <div style={{ paddingBottom: '16px' }}>
              <span style={{ fontSize: '48px', fontWeight: 900, lineHeight: 1, color: 'white', letterSpacing: '-0.04em' }}>{ovr}</span>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginLeft: '6px' }}>{pos}</span>
            </div>
          </div>

          {/* Info */}
          <div style={{ padding: '28px 20px 20px' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 800 }}>{meta.nome}</h1>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              {meta.posicao}{meta.cidade ? ` · ${meta.cidade}` : ''}
            </p>

            {/* Progresso do perfil */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Perfil completo
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#22c55e' }}>{progresso}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                <div className="prog-bar" style={{ height: '100%', background: 'linear-gradient(90deg,#16a34a,#4ade80)', borderRadius: '2px' }} />
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>
                Adicione foto e conecte-se a um treinador para subir mais.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats iniciais ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '10px', marginBottom: '16px',
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

        {/* ── Próximos passos ── */}
        <div style={{
          background: '#0b1610', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px', padding: '18px 16px', marginBottom: '16px',
        }}>
          <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Próximos passos
          </p>
          {[
            { icon: '✅', label: 'Perfil criado', done: true },
            { icon: '📸', label: 'Adicionar foto de perfil', done: false },
            { icon: '🏫', label: 'Conectar a um treinador', done: false },
            { icon: '⭐', label: 'Receber primeira avaliação', done: false },
            { icon: '🏆', label: 'Entrar no ranking da cidade', done: false },
          ].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 0',
              borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{s.icon}</span>
              <span style={{
                fontSize: '13px', fontWeight: s.done ? 700 : 500,
                color: s.done ? '#4ade80' : 'rgba(255,255,255,0.5)',
                textDecoration: s.done ? 'line-through' : 'none',
              }}>
                {s.label}
              </span>
              {s.done && <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#22c55e', fontWeight: 700 }}>Feito</span>}
            </div>
          ))}
        </div>

        {/* ── Ações ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="action-btn"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${meta.nome} · OVR ${ovr} · MeuCraque`,
                  text: `Acabei de entrar no MeuCraque! OVR ${ovr} · ${meta.posicao} · ${meta.cidade}. Você é o próximo?`,
                  url: 'https://scoutbase-eta.vercel.app',
                })
              } else {
                navigator.clipboard.writeText(`Acabei de entrar no MeuCraque! OVR ${ovr} · ${meta.posicao} · ${meta.cidade}. scoutbase-eta.vercel.app`)
                alert('Link copiado!')
              }
            }}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            <span>📲</span> Compartilhar meu perfil
          </button>

          <Link href="/" className="action-btn" style={{ justifyContent: 'center', textAlign: 'center' }}>
            Ver o ranking geral →
          </Link>
        </div>
      </div>
    </main>
  )
}
