/**
 * /convite/[id] — link de indicação do atleta (id = "92601" ou "MC-92601").
 * Mostra quem convidou e leva ao cadastro com ?ref=MC-XXXXX. A indicação só é
 * contada no servidor, ao concluir o cadastro completo (lib/indicacao.ts).
 */
import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { normalizarCodigo } from '@/lib/indicacao'

type Props = { params: Promise<{ id: string }> }

async function buscarIndicador(id: string) {
  const codigo = normalizarCodigo(id)
  if (!codigo) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('nome, avatar_url, fotos')
    .eq('athlete_id', codigo)
    .maybeSingle()
  if (!data) return null   // código inexistente: convite genérico, sem ?ref
  const fotos = ((data.fotos ?? []) as (string | null)[]).filter((f): f is string => !!f)
  return { codigo, nome: (data.nome as string | null) ?? null, foto: fotos[0] ?? (data.avatar_url as string | null) ?? null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const ind = await buscarIndicador(id)
  const primeiroNome = ind?.nome?.trim().split(' ')[0]
  const titulo = primeiroNome ? `${primeiroNome} te convidou para o Meu Craque` : 'Você foi convidado para o Meu Craque'
  return {
    title: titulo,
    description: 'Crie seu card de jogador grátis, seja avaliado por treinadores e apareça no ranking do futebol de base.',
    openGraph: { title: titulo, description: 'Crie seu card de jogador grátis no Meu Craque.', siteName: 'MeuCraque', type: 'website' },
    robots: { index: false },
  }
}

export default async function ConvitePage({ params }: Props) {
  const { id } = await params
  const ind = await buscarIndicador(id)
  const destino = ind ? `/atleta/cadastro?ref=${ind.codigo}` : '/atleta/cadastro'
  const primeiroNome = ind?.nome?.trim().split(' ')[0] ?? null

  return (
    <main style={{
      background: '#080808', minHeight: '100dvh', color: 'white', fontFamily: 'system-ui, sans-serif',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px', textAlign: 'center',
    }}>
      <p style={{ margin: '0 0 28px', fontSize: '20px', fontWeight: 900, letterSpacing: '-0.01em' }}>
        ⚽ <span style={{ color: '#00e676' }}>MEUCRAQUE</span>.com
      </p>

      {ind?.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ind.foto} alt={ind.nome ?? 'Atleta'} style={{
          width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover',
          border: '3px solid #00e676', boxShadow: '0 0 30px rgba(0,230,118,0.35)', marginBottom: '18px',
        }} />
      ) : (
        <div style={{
          width: '96px', height: '96px', borderRadius: '50%', marginBottom: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
          background: 'rgba(0,230,118,0.1)', border: '3px solid #00e676',
        }}>⚽</div>
      )}

      <h1 style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: 900, lineHeight: 1.2, maxWidth: '340px' }}>
        {primeiroNome ? <>{primeiroNome} te convidou<br />para o Meu Craque</> : 'Você foi convidado para o Meu Craque'}
      </h1>
      <p style={{ margin: '0 0 28px', fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, maxWidth: '320px' }}>
        Crie seu card de jogador grátis, seja avaliado por treinadores e apareça no ranking da sua categoria.
      </p>

      <Link href={destino} style={{
        display: 'block', width: '100%', maxWidth: '320px', padding: '16px', borderRadius: '14px',
        background: 'linear-gradient(135deg,#00c853,#00e676)', color: '#020d04',
        fontWeight: 900, fontSize: '16px', textDecoration: 'none',
      }}>
        Criar meu card grátis →
      </Link>
      <Link href="/ranking" style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
        Ver o ranking
      </Link>
    </main>
  )
}

