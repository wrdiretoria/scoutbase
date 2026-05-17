/**
 * OG Image dinâmico para /jogador/[id]
 * Gera um card 1200×630 com nome, OVR, posição e branding Meu Craque.
 * Aparece no preview do WhatsApp, Instagram, Twitter, etc.
 */

import { ImageResponse } from 'next/og'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrSingle } from '@/lib/ovr'

export const runtime = 'nodejs'
export const alt = 'Meu Craque — Perfil do Atleta'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

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

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function getInitials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  // Dados do usuário
  const { data: { user } } = await admin.auth.admin.getUserById(id)
  const meta = user?.user_metadata as { nome?: string; posicao?: string; cidade?: string; tipo?: string } | undefined

  if (!user || meta?.tipo !== 'atleta') {
    // Fallback genérico
    return new ImageResponse(
      <div style={{ width: 1200, height: 630, background: '#06100a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 64, color: '#22c55e', display: 'flex' }}>⚽ MEU CRAQUE</div>
      </div>
    )
  }

  const nome    = meta.nome    ?? 'Atleta'
  const posicao = meta.posicao ?? ''
  const cidade  = meta.cidade  ?? ''

  // Dados do perfil
  const { data: profile } = await admin
    .from('profiles')
    .select('athlete_id, data_nascimento, avatar_url')
    .eq('id', id)
    .maybeSingle()

  const athleteId = (profile?.athlete_id as string | null) ?? null
  const dataNasc  = (profile?.data_nascimento as string | null) ?? null
  const avatarUrl = (profile?.avatar_url as string | null) ?? null
  const categoria = dataNasc ? calcularCategoria(dataNasc) : null
  const pos       = posAbrev(posicao)
  const initials  = getInitials(nome)
  const ovr       = athleteId ? await fetchOvrSingle(admin, athleteId) : null
  const mcId      = athleteId ? athleteId.replace('MC-', '') : null

  return new ImageResponse(
    <div
      style={{
        width: 1200, height: 630,
        background: 'linear-gradient(135deg, #030c05 0%, #061008 50%, #0a1a0c 100%)',
        display: 'flex', flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -200, right: -200,
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)',
        display: 'flex',
      }} />
      <div style={{
        position: 'absolute', bottom: -150, left: -100,
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)',
        display: 'flex',
      }} />

      {/* Card do atleta — lado esquerdo */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: 420,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: 32, padding: '48px 40px',
        margin: '0 20px',
        boxShadow: '0 0 80px rgba(34,197,94,0.12)',
      }}>
        {/* OVR badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: 28,
        }}>
          <div style={{
            fontSize: 96, fontWeight: 900, lineHeight: 1,
            color: ovr ? '#22c55e' : 'rgba(255,255,255,0.2)',
            textShadow: ovr ? '0 0 60px rgba(34,197,94,0.6)' : 'none',
            display: 'flex',
          }}>
            {ovr ?? '—'}
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700, letterSpacing: '0.18em',
            color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase',
            display: 'flex', marginTop: 4,
          }}>
            OVERALL
          </div>
        </div>

        {/* Avatar */}
        <div style={{
          width: 100, height: 100, borderRadius: '50%',
          background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#15803d,#4ade80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, fontWeight: 900, color: 'white',
          border: '3px solid rgba(34,197,94,0.4)',
          boxShadow: '0 8px 32px rgba(34,197,94,0.3)',
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          {avatarUrl
            ? <img src={avatarUrl} width={100} height={100} style={{ objectFit: 'cover' }} />
            : <span style={{ display: 'flex' }}>{initials}</span>}
        </div>

        {/* Nome */}
        <div style={{ fontSize: 28, fontWeight: 900, color: 'white', display: 'flex', textAlign: 'center', lineHeight: 1.2 }}>
          {nome}
        </div>

        {/* Posição */}
        {pos && (
          <div style={{
            display: 'flex', marginTop: 12,
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 8, padding: '4px 16px',
            fontSize: 16, fontWeight: 800, color: '#22c55e', letterSpacing: '0.08em',
          }}>
            {pos}
          </div>
        )}
      </div>

      {/* Info — lado direito */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '0 60px' }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <span style={{ fontSize: 36, display: 'flex' }}>⚽</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'white', display: 'flex', letterSpacing: '0.03em' }}>
              MEU <span style={{ color: '#22c55e', marginLeft: 8 }}>CRAQUE</span>
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', display: 'flex', marginTop: 2 }}>
              PERFIL OFICIAL DE ATLETA
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {cidade && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22, display: 'flex' }}>📍</span>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.65)', fontWeight: 600, display: 'flex' }}>{cidade}</span>
            </div>
          )}
          {categoria && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22, display: 'flex' }}>🏆</span>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.65)', fontWeight: 600, display: 'flex' }}>{categoria}</span>
            </div>
          )}
          {posicao && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 22, display: 'flex' }}>⚽</span>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.65)', fontWeight: 600, display: 'flex' }}>{posicao}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex', marginTop: 'auto', paddingTop: 40,
          flexDirection: 'column', gap: 8,
        }}>
          <div style={{
            display: 'flex',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 14, padding: '14px 24px',
          }}>
            <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 600, display: 'flex' }}>
              meucraque.com.br/jogador/{mcId ?? id.slice(0, 8)}
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', display: 'flex', paddingLeft: 4 }}>
            Crie seu perfil de atleta grátis em meucraque.com.br
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  )
}
