import CadastroForm from './CadastroForm'

type Props = { searchParams: Promise<{ tipo?: string }> }

export default async function TreinadorCadastroPage({ searchParams }: Props) {
  const { tipo } = await searchParams
  return <CadastroForm isEscola={tipo === 'escola'} />
}
