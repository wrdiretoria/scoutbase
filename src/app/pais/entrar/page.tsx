'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Aba = 'primeiro' | 'retorno' | 'recuperar'

/** Synthetic email used as Supabase Auth identity for parents */
function sidToEmail(sid: string) {
  return `${sid.toLowerCase()}@pais.scoutbase`
}

export default function PaisEntrarPage() {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('primeiro')

  // Primeiro acesso
  const [scoutIdPrimeiro, setScoutIdPrimeiro] = useState('')
  const [senhaPrimeiro, setSenhaPrimeiro] = useState('')

  // Retorno
  const [scoutIdRetorno, setScoutIdRetorno] = useState('')
  const [senhaRetorno, setSenhaRetorno] = useState('')

  // Recuperação
  const [scoutIdRecuperar, setScoutIdRecuperar] = useState('')
  const [telefoneEncontrado, setTelefoneEncontrado] = useState<string | null>(null)

  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function trocarAba(a: Aba) {
    setAba(a)
    setErro(null)
    setInfo(null)
    setTelefoneEncontrado(null)
  }

  async function handlePrimeiroAcesso(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setInfo(null)

    const supabase = createClient()
    const sid = scoutIdPrimeiro.trim().toUpperCase()

    // 1. Valida Scout ID
    const { data: aluno, error: alunoErr } = await supabase
      .from('alunos')
      .select('id, nome')
      .eq('scout_id', sid)
      .single()

    if (alunoErr || !aluno) {
      setErro('Scout ID inválido. Verifique com o treinador do seu filho.')
      setLoading(false)
      return
    }

    // 2. Cria conta com email sintético
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: sidToEmail(sid),
      password: senhaPrimeiro,
      options: {
        data: {
          tipo: 'pai',
          aluno_scout_id: sid,
          aluno_id: aluno.id,
          aluno_nome: aluno.nome,
        },
      },
    })

    if (signUpErr) {
      if (
        signUpErr.message.includes('already registered') ||
        signUpErr.message.includes('User already registered')
      ) {
        setErro('Já existe um acesso criado para este Scout ID. Use a aba "Já tenho conta".')
      } else {
        setErro('Não foi possível criar o acesso. Tente novamente.')
      }
      setLoading(false)
      return
    }

    // 3. Salva pai_auth_id no aluno (melhor esforço)
    if (data.user) {
      await supabase
        .from('alunos')
        .update({ pai_auth_id: data.user.id })
        .eq('id', aluno.id)
    }

    // 4. Se sessão imediata → redireciona
    if (data.session) {
      router.push('/pais/perfil')
      return
    }

    // 5. Email de confirmação (raro com email sintético; normalmente cria sessão direto)
    setInfo('Acesso criado! Tente entrar usando a aba "Já tenho conta".')
    setLoading(false)
  }

  async function handleRetorno(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setInfo(null)

    const supabase = createClient()
    const sid = scoutIdRetorno.trim().toUpperCase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: sidToEmail(sid),
      password: senhaRetorno,
    })

    if (error || !data.user) {
      setErro('Scout ID ou senha incorretos.')
      setLoading(false)
      return
    }

    if (data.user.user_metadata?.tipo !== 'pai') {
      setErro('Esta conta não é de pai/responsável.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    router.push('/pais/perfil')
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setInfo(null)
    setTelefoneEncontrado(null)

    const supabase = createClient()
    const sid = scoutIdRecuperar.trim().toUpperCase()

    const { data: aluno, error } = await supabase
      .from('alunos')
      .select('responsavel, telefone')
      .eq('scout_id', sid)
      .single()

    if (error || !aluno) {
      setErro('Scout ID não encontrado. Verifique o código.')
      setLoading(false)
      return
    }

    if (!aluno.telefone) {
      setErro('Nenhum telefone cadastrado para este atleta. Entre em contato direto com o treinador.')
      setLoading(false)
      return
    }

    setTelefoneEncontrado(aluno.telefone)
    setLoading(false)
  }

  return (
    <main className="flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Acesso para Pais</h1>
        <p className="text-sm text-gray-500 mb-6">
          Acompanhe o desempenho do seu filho
        </p>

        {/* Abas */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
          <button
            onClick={() => trocarAba('primeiro')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'primeiro'
                ? 'bg-green-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Primeiro acesso
          </button>
          <button
            onClick={() => trocarAba('retorno')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'retorno'
                ? 'bg-green-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Já tenho conta
          </button>
        </div>

        {/* ── Primeiro acesso ── */}
        {aba === 'primeiro' && (
          <form onSubmit={handlePrimeiroAcesso} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scout ID do atleta
              </label>
              <input
                required
                type="text"
                value={scoutIdPrimeiro}
                onChange={(e) => setScoutIdPrimeiro(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="SID-00001"
              />
              <p className="text-xs text-gray-400 mt-1">
                Peça o Scout ID ao treinador do seu filho.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crie uma senha
              </label>
              <input
                required
                type="password"
                minLength={6}
                value={senhaPrimeiro}
                onChange={(e) => setSenhaPrimeiro(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
            )}
            {info && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{info}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Criando acesso...' : 'Criar acesso'}
            </button>
          </form>
        )}

        {/* ── Retorno ── */}
        {aba === 'retorno' && (
          <form onSubmit={handleRetorno} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scout ID do atleta
              </label>
              <input
                required
                type="text"
                value={scoutIdRetorno}
                onChange={(e) => setScoutIdRetorno(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="SID-00001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                required
                type="password"
                value={senhaRetorno}
                onChange={(e) => setSenhaRetorno(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>

            {erro && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => trocarAba('recuperar')}
              className="w-full text-center text-xs text-gray-400 hover:text-green-600 transition-colors pt-1"
            >
              Esqueci minha senha
            </button>
          </form>
        )}

        {/* ── Recuperação ── */}
        {aba === 'recuperar' && (
          <div className="space-y-4">
            {!telefoneEncontrado ? (
              <form onSubmit={handleRecuperar} className="space-y-4">
                <p className="text-sm text-gray-500">
                  Informe o Scout ID do seu filho. Vamos mostrar o contato do treinador para ele resetar sua senha.
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scout ID do atleta
                  </label>
                  <input
                    required
                    type="text"
                    value={scoutIdRecuperar}
                    onChange={(e) => setScoutIdRecuperar(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="SID-00001"
                  />
                </div>

                {erro && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {loading ? 'Buscando...' : 'Buscar contato'}
                </button>

                <button
                  type="button"
                  onClick={() => trocarAba('retorno')}
                  className="w-full text-center text-xs text-gray-400 hover:text-green-600 transition-colors"
                >
                  ← Voltar ao login
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    Entre em contato com o treinador
                  </p>
                  <p className="text-xs text-green-600 mb-3">
                    Peça para ele resetar sua senha.
                  </p>
                  <a
                    href={`https://wa.me/55${telefoneEncontrado.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chamar no WhatsApp
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => { setTelefoneEncontrado(null); trocarAba('retorno') }}
                  className="w-full text-center text-xs text-gray-400 hover:text-green-600 transition-colors"
                >
                  ← Voltar ao login
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-center text-gray-400 mt-6">
          É treinador?{' '}
          <Link href="/login" className="text-green-600 hover:underline">
            Acesse por aqui
          </Link>
        </p>
      </div>
    </main>
  )
}
