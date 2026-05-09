/**
 * /entrar/[treinadorId] — Página de convite da escolinha
 * Qualquer atleta que recebe o link do treinador cai aqui.
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'

type Props = { params: Promise<{ treinadorId: string }> }

export default async function EntrarPage({ params }: Props) {
  const { treinadorId } = await params

  const admin = createAdminClient()
  const { data: { user }, error } = await admin.auth.admin.getUserById(treinadorId)

  if (error || !user) notFound()

  const meta = user.user_metadata as { nome?: string; tipo?: string }

  // Não permite atleta virar "escola"
  if (meta?.tipo === 'atleta') notFound()

  const nomeTreinador = meta?.nome ?? 'Treinador'
  const primeiroNome = nomeTreinador.split(' ')[0]
  const inicial = primeiroNome[0]?.toUpperCase() ?? 'T'

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>

        {/* Logo */}
        <div style={{ marginBottom: '44px' }}>
          <Link href="/" style={{
            fontSize: '18px', fontWeight: 800, color: 'white',
            textDecoration: 'none', letterSpacing: '0.03em',
          }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </Link>
        </div>

        {/* Card de convite */}
        <div style={{
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: '24px', padding: '36px 28px', marginBottom: '16px',
        }}>
          {/* Avatar inicial */}
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg,#15803d,#4ade80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', fontWeight: 900, color: 'white',
            boxShadow: '0 8px 24px rgba(34,197,94,0.3)',
          }}>
            {inicial}
          </div>

          <p style={{
            margin: '0 0 8px', fontSize: '11px', color: '#22c55e',
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Convite da escolinha
          </p>

          <h1 style={{
            margin: '0 0 14px', fontSize: '28px', fontWeight: 900,
            color: 'white', letterSpacing: '-0.02em',
          }}>
            {primeiroNome} te convidou!
          </h1>

          <p style={{
            margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.45)',
            lineHeight: 1.6,
          }}>
            Crie seu perfil de atleta, entre no ranking e faça parte da escolinha de{' '}
            <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{nomeTreinador}</strong>.
          </p>
        </div>

        {/* CTAs */}
        <Link
          href={`/atleta/cadastro?escola=${treinadorId}`}
          style={{
            display: 'block', padding: '16px', borderRadius: '14px',
            marginBottom: '10px',
            background: '#22c55e', color: 'black', fontWeight: 800,
            fontSize: '16px', textDecoration: 'none',
          }}
        >
          🔥 Criar meu perfil agora
        </Link>

        <Link
          href="/login"
          style={{
            display: 'block', padding: '14px', borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.4)', fontWeight: 600,
            fontSize: '14px', textDecoration: 'none',
          }}
        >
          Já tenho conta → Entrar
        </Link>

        <p style={{ marginTop: '28px', fontSize: '12px', color: 'rgba(255,255,255,0.18)' }}>
          Seu perfil ficará visível no ranking público 🏆
        </p>
      </div>
    </main>
  )
}
