/**
 * Página pública de convite. Mantém o código de indicação no cadastro, mas não
 * expõe nome, foto ou outros dados do atleta que compartilhou o link.
 */
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { normalizarCodigo } from '@/lib/indicacao'

type Props = { params: Promise<{ id: string }> }

async function buscarCodigoValido(id: string): Promise<string | null> {
  const codigo = normalizarCodigo(id)
  if (!codigo) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('athlete_id', codigo)
    .maybeSingle()
  return data ? codigo : null
}

export async function generateMetadata(): Promise<Metadata> {
  const titulo = 'Você foi convidado para o Meu Craque'
  const descricao = 'Crie seu perfil de atleta, acompanhe sua evolução e conheça oportunidades no futebol de base.'
  return {
    title: titulo,
    description: descricao,
    openGraph: { title: titulo, description: descricao, siteName: 'MeuCraque', type: 'website' },
    robots: { index: false },
  }
}

export default async function ConvitePage({ params }: Props) {
  const { id } = await params
  const codigo = await buscarCodigoValido(id)
  const destino = codigo ? `/atleta/cadastro?ref=${codigo}` : '/atleta/cadastro'

  return (
    <main style={{
      background: '#080808', minHeight: '100dvh', color: 'white', fontFamily: 'system-ui, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', textAlign: 'center',
    }}>
      <p style={{ margin: '0 0 28px', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.01em' }}>
        ⚽ <span style={{ color: '#00e676' }}>MEUCRAQUE</span>.com
      </p>

      <div style={{
        width: '96px', height: '96px', borderRadius: '50%', marginBottom: '18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
        background: 'rgba(0,230,118,0.1)', border: '3px solid #00e676',
      }}>⚽</div>

      <h1 style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: 900, lineHeight: 1.2, maxWidth: '340px' }}>
        Você foi convidado<br />para o Meu Craque
      </h1>
      <p style={{ margin: '0 0 28px', fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: '320px' }}>
        Crie seu perfil de atleta grátis, acompanhe sua evolução e descubra novas oportunidades no futebol de base.
      </p>

      <Link href={destino} style={{
        display: 'block', width: '100%', maxWidth: '320px', padding: '16px', borderRadius: '14px',
        background: 'linear-gradient(135deg,#00c853,#00e676)', color: '#020d04',
        fontWeight: 900, fontSize: '16px', textDecoration: 'none',
      }}>
        Criar meu perfil grátis →
      </Link>
      <Link href="/ranking" style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
        Ver o ranking
      </Link>
    </main>
  )
}
