/**
 * /atleta/cadastro — Server wrapper que lê ?escola= e passa para o form client.
 */

import { createAdminClient } from '@/lib/supabase'
import CadastroForm from './CadastroForm'

type Props = { searchParams: Promise<{ escola?: string }> }

export default async function Page({ searchParams }: Props) {
  const { escola } = await searchParams

  let escolaNome: string | null = null

  if (escola) {
    try {
      const admin = createAdminClient()
      const { data: { user } } = await admin.auth.admin.getUserById(escola)
      if (user) {
        escolaNome = (user.user_metadata as { nome?: string })?.nome ?? 'Treinador'
      }
    } catch {
      // escola inválida — ignora banner, cadastro continua normal
    }
  }

  return <CadastroForm escolaId={escola ?? null} escolaNome={escolaNome} />
}
