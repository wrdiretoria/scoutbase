'use client'

/**
 * "Convide seu time" — indicação premiada no perfil do atleta.
 * 3 amigos com perfil completo e primeira avaliação oficial = 1 avaliação grátis
 * (regra e antifraude no servidor: lib/indicacao.ts).
 */
import { useEffect, useState } from 'react'

export type StatsIndicacao = { noLote: number; meta: number; faltam: number; premios: number; count: number; pendentes: number }

const BASE_URL = 'https://www.meucraque.com'

export default function ConviteTimeSection({ athleteId, stats: statsProp }: {
  athleteId: string
  stats?: StatsIndicacao          // opcional (testes); sem ele busca /api/indicacao/stats
}) {
  const [stats, setStats]   = useState<StatsIndicacao | null>(statsProp ?? null)
  const [copied, setCopied] = useState(false)

  const numero = athleteId.replace(/^MC-/i, '')
  const link = `${BASE_URL}/convite/${numero}`
  const mensagem = `Criei meu card de jogador no Meu Craque! Cria o seu grátis: ${link}`
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`

  useEffect(() => {
    if (statsProp) return
    fetch('/api/indicacao/stats')
      .then(r => (r.ok ? r.json() : null))
      .then((d: StatsIndicacao | null) => setStats(d ?? { noLote: 0, meta: 3, faltam: 3, premios: 0, count: 0, pendentes: 0 }))
      .catch(() => setStats({ noLote: 0, meta: 3, faltam: 3, premios: 0, count: 0, pendentes: 0 }))
  }, [statsProp])

  function copiar() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    })
  }

  const meta   = stats?.meta ?? 3
  const noLote = stats?.noLote ?? 0

  return (
    <div style={{
      padding: '18px', borderRadius: '16px', marginBottom: '16px',
      background: 'linear-gradient(135deg,rgba(0,230,118,0.08),rgba(37,211,102,0.04))',
      border: '1px solid rgba(0,230,118,0.22)',
    }}>
      {/* Cabeçalho + contador X/3 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <span style={{ fontSize: '26px', lineHeight: 1 }}>👥</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'white' }}>Convide seu time</p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
            Cada 3 amigos com perfil completo e primeira avaliação oficial = <strong style={{ color: '#00e676' }}>1 avaliação grátis</strong>
          </p>
        </div>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <span style={{ display: 'block', fontSize: '26px', fontWeight: 900, color: '#00e676', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {stats ? `${noLote}/${meta}` : '…'}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            amigos
          </span>
        </div>
      </div>

      {/* Barra de progresso em 3 partes */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {Array.from({ length: meta }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: '8px', borderRadius: '4px',
            background: i < noLote ? 'linear-gradient(90deg,#00c853,#00e676)' : 'rgba(255,255,255,0.08)',
            boxShadow: i < noLote ? '0 0 8px rgba(0,230,118,0.45)' : 'none',
            transition: 'background .4s ease',
          }} />
        ))}
      </div>
      <p style={{ margin: '0 0 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
        {!stats ? ' ' :
          stats.premios > 0
            ? `🎉 Você já ganhou ${stats.premios} ${stats.premios > 1 ? 'avaliações grátis' : 'avaliação grátis'} · ${stats.faltam > 1 ? 'faltam' : 'falta'} ${stats.faltam} para a próxima`
            : `${stats.faltam > 1 ? 'Faltam' : 'Falta'} ${stats.faltam} amigo${stats.faltam > 1 ? 's' : ''} para a sua avaliação grátis`}
      </p>

      {stats && stats.pendentes > 0 && (
        <p style={{ margin: '0 0 12px', fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>
          {stats.pendentes} {stats.pendentes === 1 ? 'convite aguarda' : 'convites aguardam'} a primeira avaliação oficial.
        </p>
      )}

      {/* Convidar no WhatsApp */}
      <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        width: '100%', padding: '14px', borderRadius: '12px', boxSizing: 'border-box',
        background: '#25D366', color: '#062b14', fontWeight: 900, fontSize: '15px', textDecoration: 'none',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.45 9.45 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03C2.57 6.8 6.83 2.55 12.06 2.55c2.53 0 4.91.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.22-4.25 9.47-9.48 9.47zm8.06-17.53A11.33 11.33 0 0 0 12.05.63C5.77.63.66 5.73.66 12.02c0 2.01.52 3.97 1.52 5.7L.56 23.37l5.78-1.52a11.36 11.36 0 0 0 5.71 1.46h.01c6.28 0 11.39-5.1 11.39-11.39 0-3.04-1.18-5.9-3.34-8.05z" />
        </svg>
        Convidar no WhatsApp
      </a>

      {/* Copiar link */}
      <button onClick={copiar} style={{
        marginTop: '8px', width: '100%', padding: '11px', borderRadius: '12px', cursor: 'pointer',
        background: copied ? 'rgba(0,230,118,0.15)' : 'transparent',
        border: '1px solid rgba(255,255,255,0.12)', color: copied ? '#00e676' : 'rgba(255,255,255,0.6)',
        fontWeight: 700, fontSize: '13px', fontFamily: 'system-ui, sans-serif',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {copied ? '✓ Link copiado' : `🔗 Copiar link · meucraque.com/convite/${numero}`}
      </button>
    </div>
  )
}

