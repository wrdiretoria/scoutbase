import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import AvaliacaoClient from './AvaliacaoClient'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AvaliacoesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, posicao')
    .eq('id', id)
    .eq('professor_id', user.id)
    .single()

  if (!aluno) notFound()

  const { data: rawAvaliacoes } = await supabase
    .from('avaliacoes')
    .select('nota, categoria, data')
    .eq('aluno_id', id)
    .in('categoria', ['Técnico', 'Físico', 'Tático', 'Comportamento'])
    .order('data', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href={`/alunos/${id}`}
          className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1"
        >
          ← {aluno.nome}
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliação</h1>
          {aluno.posicao && (
            <p className="text-sm text-gray-500 mt-0.5">{aluno.posicao}</p>
          )}
        </div>

        <AvaliacaoClient alunoId={id} professorId={user.id} rawAvaliacoes={rawAvaliacoes ?? []} />
      </div>
    </main>
  )
}
