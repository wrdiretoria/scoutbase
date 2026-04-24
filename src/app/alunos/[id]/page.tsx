import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import CopyLinkButton from './CopyLinkButton'
import ExportarPDFButton from './ExportarPDFButton'

type Props = {
  params: Promise<{ id: string }>
}

export default async function AlunoPerfilPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, posicao, responsavel, telefone, ativo, token_acesso, turmas(nome)')
    .eq('id', id)
    .eq('professor_id', user.id)
    .single()

  if (!aluno) notFound()

  // Scout Score: média das avaliações
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('nota, categoria, data')
    .eq('aluno_id', id)
    .order('data', { ascending: false })

  const notas = (avaliacoes ?? []).map((a) => a.nota).filter((n) => n != null) as number[]
  const scoutScore =
    notas.length > 0
      ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)
      : null

  // Frequência total
  const { data: presencas } = await supabase
    .from('presencas')
    .select('presente')
    .eq('aluno_id', id)

  const totalPresencas = presencas?.length ?? 0
  const presentes = presencas?.filter((p) => p.presente).length ?? 0
  const frequencia =
    totalPresencas > 0 ? Math.round((presentes / totalPresencas) * 100) : null

  // Frequência do mês atual
  const agora = new Date()
  const primeiroDiaMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
  const { data: presencasMes } = await supabase
    .from('presencas')
    .select('presente')
    .eq('aluno_id', id)
    .gte('data', primeiroDiaMes)

  const totalMes = presencasMes?.length ?? 0
  const presentesMes = presencasMes?.filter((p) => p.presente).length ?? 0
  const frequenciaMes =
    totalMes > 0 ? Math.round((presentesMes / totalMes) * 100) : null

  const scoreColor =
    scoutScore === null
      ? 'text-gray-300'
      : scoutScore >= 75
      ? 'text-green-600'
      : scoutScore >= 50
      ? 'text-yellow-500'
      : 'text-red-500'

  const turmaNome =
    aluno.turmas && !Array.isArray(aluno.turmas)
      ? (aluno.turmas as { nome: string }).nome
      : null

  const nomeEscolinha = (user.user_metadata?.nome as string | undefined) ?? user.email ?? 'Escolinha'

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  const linkPublico = aluno.token_acesso
    ? `${proto}://${host}/p/${aluno.token_acesso}`
    : null

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Voltar */}
        <Link href="/alunos" className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-1">
          ← Alunos
        </Link>

        {/* Card principal */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    aluno.ativo ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {aluno.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 truncate">{aluno.nome}</h1>
              {aluno.posicao && (
                <p className="text-sm text-gray-500 mt-0.5">{aluno.posicao}</p>
              )}
              {turmaNome && (
                <p className="text-xs text-gray-400 mt-0.5">{turmaNome}</p>
              )}
            </div>

            {/* Scout Score */}
            <div className="text-center flex-shrink-0">
              <p className="text-xs text-gray-400 mb-1">Scout Score</p>
              <p className={`text-5xl font-bold leading-none ${scoreColor}`}>
                {scoutScore ?? '—'}
              </p>
              {scoutScore !== null && (
                <p className="text-xs text-gray-400 mt-1">de 100</p>
              )}
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400">Frequência</p>
            <p
              className={`text-2xl font-bold mt-1 ${
                frequencia === null
                  ? 'text-gray-300'
                  : frequencia >= 75
                  ? 'text-green-600'
                  : 'text-red-500'
              }`}
            >
              {frequencia !== null ? `${frequencia}%` : '—'}
            </p>
            {totalPresencas > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {presentes}/{totalPresencas} aulas
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs text-gray-400">Avaliações</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {avaliacoes?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Contato */}
        {(aluno.responsavel || aluno.telefone) && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Responsável</h2>
            <div className="space-y-1">
              {aluno.responsavel && (
                <p className="text-sm text-gray-700">{aluno.responsavel}</p>
              )}
              {aluno.telefone && (
                <p className="text-sm text-gray-500">{aluno.telefone}</p>
              )}
            </div>
          </div>
        )}

        {/* Link para pais */}
        {linkPublico && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">Link para os pais</p>
            <p className="text-xs text-gray-400 mb-3">Compartilhe este link para que os pais acompanhem o desempenho do atleta.</p>
            <CopyLinkButton url={linkPublico} />
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <Link
            href={`/avaliacoes/${id}`}
            className="block w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            Nova avaliação
          </Link>
          <ExportarPDFButton
            nomeAluno={aluno.nome}
            turma={turmaNome}
            posicao={aluno.posicao ?? null}
            scoutScore={scoutScore}
            frequencia={frequencia}
            frequenciaMes={frequenciaMes}
            presentes={presentes}
            totalPresencas={totalPresencas}
            avaliacoes={(avaliacoes ?? []).map((av) => ({
              nota: av.nota,
              categoria: av.categoria ?? null,
              data: av.data ?? null,
            }))}
            nomeEscolinha={nomeEscolinha}
          />
        </div>

        {/* Últimas avaliações */}
        {avaliacoes && avaliacoes.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              Últimas avaliações
            </h2>
            <ul className="divide-y divide-gray-50">
              {avaliacoes.slice(0, 5).map((av, i) => (
                <li key={i} className="flex items-center justify-between py-3">
                  <div>
                    {av.categoria && (
                      <p className="text-sm text-gray-800">{av.categoria}</p>
                    )}
                    {av.data && (
                      <p className="text-xs text-gray-400">
                        {new Date(av.data).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      av.nota >= 75
                        ? 'text-green-600'
                        : av.nota >= 50
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}
                  >
                    {av.nota}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
