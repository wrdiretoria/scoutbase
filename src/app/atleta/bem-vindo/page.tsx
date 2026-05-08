'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

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
  // Determinístico pelo nome — parece pessoal, mas é sempre o mesmo pra mesma pessoa
  const hash = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 68 + (hash % 13) // 68–80
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function posLabel(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function BemVindoContent() {
  const params = useSearchParams()
  const nome    = params.get('nome')    ?? 'Atleta'
  const posicao = params.get('posicao') ?? 'Atleta'
  const cidade  = params.get('cidade')  ?? ''
  const dataNasc = params.get('dataNasc') ?? ''

  const ovr       = calcularOVR(nome)
  const categoria = dataNasc ? calcularCategoria(dataNasc) : ''
  const initials  = getInitials(nome)
  const posAbrev  = posLabel(posicao)

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes cardIn {
          from { opacity:0; transform:translateY(24px) scale(0.97) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        @keyframes pulse-ring {
          0%   { transform:scale(1);   opacity:0.6 }
          100% { transform:scale(1.6); opacity:0 }
        }
        .card-animate { animation: cardIn 0.6s ease forwards; }
        .share-btn {
          padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer;
          background: #22c55e; color: black; font-weight: 800; font-size: 15px;
          width: 100%; transition: opacity 0.2s;
          font-family: system-ui, sans-serif;
        }
        .share-btn:hover { opacity: 0.88; }
        .secondary-btn {
          padding: 12px 28px; border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12); cursor: pointer;
          background: transparent; color: rgba(255,255,255,0.5);
          font-size: 14px; width: 100%; font-family: system-ui, sans-serif;
          transition: border-color 0.2s;
        }
        .secondary-btn:hover { border-color: rgba(255,255,255,0.25); }
      `}</style>

      <div className="card-animate" style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Mensagem de boas-vindas */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#22c55e', fontWeight: 700, letterSpacing: '0.08em' }}>
            🔥 PERFIL CRIADO
          </p>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            Bem-vindo ao jogo,<br />
            <span style={{ color: '#22c55e' }}>{nome.split(' ')[0]}.</span>
          </h1>
        </div>

        {/* O CARD — estilo FIFA UT */}
        <div style={{
          borderRadius: '20px', overflow: 'hidden',
          background: '#0b1610',
          border: '1px solid rgba(34,197,94,0.2)',
          boxShadow: '0 0 60px rgba(34,197,94,0.2), 0 24px 60px rgba(0,0,0,0.6)',
          position: 'relative',
        }}>
          {/* Topo verde */}
          <div style={{
            background: 'linear-gradient(160deg,#15803d 0%,#064e1e 100%)',
            padding: '24px 20px 0',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minHeight: '130px', position: 'relative',
          }}>
            {/* Badge categoria */}
            {categoria && (
              <div style={{
                position: 'absolute', top: '12px', left: '14px',
                background: 'rgba(0,0,0,0.4)', borderRadius: '20px',
                padding: '2px 8px', fontSize: '9px', fontWeight: 800,
                color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em',
              }}>
                {categoria}
              </div>
            )}

            {/* Badge NOVO */}
            <div style={{
              position: 'absolute', top: '12px', right: '14px',
              background: '#22c55e', borderRadius: '20px',
              padding: '2px 8px', fontSize: '9px', fontWeight: 800,
              color: 'black', letterSpacing: '0.06em',
            }}>
              NOVO
            </div>

            {/* OVR + POS */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginTop: '24px', marginBottom: '14px' }}>
              <span style={{
                fontSize: '60px', fontWeight: 900, lineHeight: 1,
                color: 'white', letterSpacing: '-0.04em',
                textShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}>
                {ovr}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: '10px' }}>
                {posAbrev}
              </span>
            </div>
          </div>

          {/* Avatar flutuante */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-32px', position: 'relative', zIndex: 2 }}>
            <div style={{ position: 'relative' }}>
              {/* Anel pulsante */}
              <div style={{
                position: 'absolute', inset: '-6px',
                borderRadius: '50%', border: '2px solid rgba(34,197,94,0.5)',
                animation: 'pulse-ring 2s ease-out infinite',
              }} />
              <div style={{
                width: '68px', height: '68px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#15803d,#4ade80)',
                border: '3px solid #0b1610',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', fontWeight: 900, color: 'white',
                boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
              }}>
                {initials}
              </div>
            </div>
          </div>

          {/* Dados */}
          <div style={{ padding: '12px 20px 22px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 2px', fontSize: '17px', fontWeight: 800, color: 'white' }}>{nome}</p>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              {posicao}{cidade ? ` · ${cidade}` : ''}
            </p>

            {/* Stats iniciais */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '14px',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
            }}>
              {[
                { label: 'Ranking', val: '—' },
                { label: 'Avaliações', val: '0' },
                { label: 'Status', val: 'Ativo' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#22c55e' }}>{s.val}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Aviso evolução */}
            <div style={{
              marginTop: '14px', padding: '8px 12px', borderRadius: '8px',
              background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)',
            }}>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Seu OVR sobe conforme você recebe avaliações do seu treinador.
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="share-btn"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `${nome} · OVR ${ovr} · MeuCraque`,
                  text: `Acabei de entrar no MeuCraque! Meu OVR inicial é ${ovr}. Você é o próximo?`,
                  url: 'https://scoutbase-eta.vercel.app',
                })
              } else {
                navigator.clipboard.writeText(`Acabei de entrar no MeuCraque! OVR ${ovr} · ${posicao} · ${cidade}. Você é o próximo? scoutbase-eta.vercel.app`)
                alert('Link copiado! Cole no seu story ou grupo.')
              }
            }}
          >
            📲 Compartilhar meu card
          </button>

          <Link href="/atleta/perfil" style={{ textDecoration: 'none' }}>
            <button className="secondary-btn">
              Ver meu perfil completo →
            </button>
          </Link>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span> · Você é o próximo.
        </p>
      </div>
    </main>
  )
}

export default function BemVindoPage() {
  return (
    <Suspense fallback={
      <main style={{ background: '#06100a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui' }}>Carregando…</p>
      </main>
    }>
      <BemVindoContent />
    </Suspense>
  )
}
