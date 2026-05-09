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
      <style>{`
        @keyframes cardIn {
          from { opacity:0; transform:translateY(28px) scale(0.96) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        @keyframes ovrIn {
          0%  { opacity:0; transform:scale(0.6) }
          65% { transform:scale(1.06) }
          100%{ opacity:1; transform:scale(1) }
        }
        @keyframes glowPulse {
          0%,100% { text-shadow:0 0 24px rgba(34,197,94,0.5),0 0 48px rgba(34,197,94,0.22) }
          50%     { text-shadow:0 0 40px rgba(34,197,94,0.78),0 0 80px rgba(34,197,94,0.38) }
        }
        .pub-card { animation: cardIn .55s cubic-bezier(.22,.68,0,1.2) forwards; }
        .pub-ovr  { animation: ovrIn .5s cubic-bezier(.22,.68,0,1.2) forwards .3s, glowPulse 3s ease-in-out infinite 1s; opacity:0; }
      `}</style>

      <div className="pub-card" style={{ width:'100%', maxWidth:'320px' }}>
        <div style={{
          borderRadius:'22px', overflow:'hidden',
          background:'#0b1610',
          border:'1px solid rgba(34,197,94,0.22)',
          boxShadow:'0 0 56px rgba(34,197,94,0.18), 0 24px 64px rgba(0,0,0,0.65)',
        }}>

          {/* Topo */}
          <div style={{
            position:'relative', minHeight:'156px',
            background:'linear-gradient(160deg,#166534 0%,#052e16 100%)',
            backgroundImage:'linear-gradient(160deg,#166534 0%,#052e16 100%), repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 28px),repeating-linear-gradient(90deg,rgba(255,255,255,0.025) 0px,rgba(255,255,255,0.025) 1px,transparent 1px,transparent 28px)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            padding:'20px 16px 0',
          }}>
            {/* Posição — esquerda */}
            <div style={{
              position:'absolute', top:'14px', left:'14px',
              background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
              border:'1px solid rgba(255,255,255,0.15)',
              borderRadius:'8px', padding:'4px 10px',
              fontSize:'10px', fontWeight:800, color:'white', letterSpacing:'0.08em',
            }}>
              {pos}
            </div>

            {/* Categoria — direita */}
            {categoria && (
              <div style={{
                position:'absolute', top:'14px', right:'14px',
                background:'rgba(34,197,94,0.18)', border:'1px solid rgba(34,197,94,0.35)',
                borderRadius:'8px', padding:'4px 10px',
                fontSize:'10px', fontWeight:800, color:'#4ade80', letterSpacing:'0.06em',
              }}>
                {categoria}
              </div>
            )}

            {/* OVR */}
            <div className="pub-ovr" style={{ textAlign:'center', marginTop:'12px' }}>
              <div style={{ fontSize:'76px', fontWeight:900, color:'white', lineHeight:1, letterSpacing:'-0.05em' }}>
                {ovr}
              </div>
              <div style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.18em', color:'rgba(255,255,255,0.45)', textTransform:'uppercase', marginTop:'4px' }}>
                Overall
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div style={{ display:'flex', justifyContent:'center', marginTop:'-34px', position:'relative', zIndex:2 }}>
            <div style={{
              width:'68px', height:'68px', borderRadius:'50%',
              background:'linear-gradient(135deg,#15803d,#4ade80)',
              border:'3px solid #0b1610',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'20px', fontWeight:900, color:'white',
              boxShadow:'0 8px 28px rgba(34,197,94,0.45)',
            }}>
              {initials}
            </div>
          </div>

          {/* Dados */}
          <div style={{ padding:'12px 20px 22px', textAlign:'center' }}>
            <h1 style={{ margin:'0 0 2px', fontSize:'18px', fontWeight:800, color:'white' }}>{nome}</h1>
            <p style={{ margin:'0 0 16px', fontSize:'12px', color:'rgba(255,255,255,0.38)' }}>
              {posicao}{cidade ? ` · ${cidade}` : ''}
            </p>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px' }}>
              {[
                { label:'Categoria', val: categoria ?? '—' },
                { label:'Desde',     val: criadoEm },
                { label:'Status',    val:'Ativo' },
                { label:'Overall',   val: String(ovr) },
              ].map(s => (
                <div key={s.label} style={{
                  background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                  borderRadius:'10px', padding:'10px 8px',
                }}>
                  <p style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:800, color:'#22c55e' }}>{s.val}</p>
                  <p style={{ margin:0, fontSize:'9px', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Frase */}
            <p style={{ margin:'0 0 16px', fontSize:'12px', color:'rgba(255,255,255,0.35)', fontStyle:'italic', lineHeight:1.6 }}>
              "Mostre seu futebol ao mundo."
            </p>

            {/* CTA */}
            <Link href="/cadastro" style={{
              display:'block', padding:'13px', borderRadius:'14px',
              background:'#22c55e', color:'black', fontWeight:800,
              fontSize:'14px', textDecoration:'none', textAlign:'center',
            }}>
              Você é o próximo → Criar meu perfil
            </Link>
          </div>
        </div>
      </div>

      <div style={{ marginTop:'20px', textAlign:'center' }}>
        <Link href="/" style={{ fontSize:'13px', fontWeight:800, color:'white', textDecoration:'none', letterSpacing:'0.04em' }}>
          ⚽ MEU <span style={{ color:'#22c55e' }}>CRAQUE</span>
        </Link>
        <p style={{ margin:'4px 0 0', fontSize:'11px', color:'rgba(255,255,255,0.2)' }}>
          O palco digital do futebol brasileiro
        </p>
      </div>
    </main>
  )
}
