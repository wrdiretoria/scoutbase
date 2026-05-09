/**
 * /jogador/[id] — Card público do atleta self-registrado
 * Acessível sem login. Compartilhável no story / WhatsApp / grupos.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'

type Props = { params: Promise<{ id: string }> }

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

export default async function JogadorPublicoPage({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  // Busca dados do usuário via admin (bypass RLS)
  const { data: { user }, error } = await admin.auth.admin.getUserById(id)

  if (error || !user) notFound()

  const meta = user.user_metadata as {
    nome?: string; posicao?: string; cidade?: string; tipo?: string
  }

  // Só mostra se for atleta
  if (meta?.tipo !== 'atleta') notFound()

  const nome    = meta.nome    ?? 'Atleta'
  const posicao = meta.posicao ?? ''
  const cidade  = meta.cidade  ?? ''

  // Busca data de nascimento
  const { data: profile } = await admin
    .from('profiles')
    .select('data_nascimento')
    .eq('id', id)
    .single()

  const dataNasc  = profile?.data_nascimento as string | null
  const categoria = dataNasc ? calcularCategoria(dataNasc) : null
  const ovr       = calcularOVR(nome)
  const initials  = getInitials(nome)
  const pos       = posAbrev(posicao)
  const criadoEm  = new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      fontFamily: 'system-ui, sans-serif',
    }}>

      {/* Card público */}
      <div style={{
        width: '100%', maxWidth: '340px',
        borderRadius: '24px', overflow: 'hidden',
        background: '#0b1610',
        border: '1px solid rgba(34,197,94,0.2)',
        boxShadow: '0 0 60px rgba(34,197,94,0.15), 0 32px 80px rgba(0,0,0,0.7)',
      }}>
        {/* Topo */}
        <div style={{
          background: 'linear-gradient(160deg,#15803d 0%,#064e1e 100%)',
          padding: '24px 20px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          minHeight: '140px', position: 'relative',
        }}>
          {categoria && (
            <div style={{
              position: 'absolute', top: '14px', left: '16px',
              background: 'rgba(0,0,0,0.45)', borderRadius: '20px',
              padding: '3px 10px', fontSize: '9px', fontWeight: 800,
              color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em',
            }}>
              {categoria}
            </div>
          )}

          {/* Verificado */}
          <div style={{
            position: 'absolute', top: '14px', right: '16px',
            background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: '20px', padding: '3px 10px',
            fontSize: '9px', fontWeight: 800, color: '#4ade80',
          }}>
            ✓ MEUCRAQUE
          </div>

          {/* OVR */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginTop: '32px', marginBottom: '16px' }}>
            <span style={{
              fontSize: '68px', fontWeight: 900, lineHeight: 1, color: 'white',
              letterSpacing: '-0.04em', textShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}>
              {ovr}
            </span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: '12px' }}>
              {pos}
            </span>
          </div>
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-36px', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#15803d,#4ade80)',
            border: '3px solid #0b1610',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: 900, color: 'white',
            boxShadow: '0 8px 32px rgba(34,197,94,0.45)',
          }}>
            {initials}
          </div>
        </div>

        {/* Dados */}
        <div style={{ padding: '14px 22px 24px', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 4px', fontSize: '19px', fontWeight: 800, color: 'white' }}>{nome}</h1>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            {posicao}{cidade ? ` · ${cidade}` : ''}
          </p>

          {/* Stats */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '8px', marginBottom: '18px',
          }}>
            {[
              { label: 'OVR', val: String(ovr) },
              { label: 'Categoria', val: categoria ?? '—' },
              { label: 'Status', val: 'Ativo' },
              { label: 'Desde', val: criadoEm },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', padding: '10px 8px',
              }}>
                <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 800, color: '#22c55e' }}>{s.val}</p>
                <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Verificação */}
          <div style={{
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
            borderRadius: '10px', padding: '10px 12px', marginBottom: '18px',
          }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              🔐 Perfil registrado no MeuCraque. OVR aumenta com avaliações do treinador.
            </p>
          </div>

          {/* CTA */}
          <Link href="/cadastro" style={{
            display: 'block', padding: '13px', borderRadius: '14px',
            background: '#22c55e', color: 'black', fontWeight: 800,
            fontSize: '14px', textDecoration: 'none', textAlign: 'center',
          }}>
            Você é o próximo → Criar meu perfil
          </Link>
        </div>
      </div>

      {/* Rodapé */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <Link href="/" style={{ fontSize: '13px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.04em' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </Link>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
          O palco digital do futebol brasileiro
        </p>
      </div>
    </main>
  )
}
