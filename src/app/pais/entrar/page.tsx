'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Aba = 'primeiro' | 'retorno'

export default function PaisEntrarPage() {
  const router = useRouter()
  const [aba, setAba] = useState<Aba>('primeiro')

  // Primeiro acesso
  const [codigo, setCodigo] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')

  // Retorno
  const [emailRetorno, setEmailRetorno] = useState('')
  const [senhaRetorno, setSenhaRetorno] = useState('')

  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePrimeiroAcesso(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setInfo(null)

    const supabase = createClient()

    // 1. Valida o código
    const codigoFormatado = codigo.trim().padStart(3, '0')
    const { data: aluno, error: alunoErr } = await supabase
      .from('alunos')
      .select('id, nome')
      .eq('codigo', codigoFormatado)
      .single()

    if (alunoErr || !aluno) {
      setErro('Código inválido. Verifique com o treinador do seu filho.')
      setLoading(false)
      return
    }

    // 2. Cria a conta
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          tipo: 'pai',
          aluno_codigo: codigoFormatado,
          aluno_id: aluno.id,
          aluno_nome: aluno.nome,
        },
      },
    })

    if (signUpErr) {
      if (signUpErr.message.includes('already registered')) {
        setErro('Este email já está cadastrado. Use a aba "Já tenho conta".')
      } else {
        setErro('Não foi possível criar o acesso. Tente novamente.')
      }
      setLoading(false)
      return
    }

    // 3. Se sessão imediata → redireciona
    if (data.session) {
      router.push('/pais/perfil')
      return
    }

    // 4. Email de confirmação necessário
    setInfo('Acesso criado! Verifique seu email e clique no link de confirmação para entrar.')
    setLoading(false)
  }

  async function handleRetorno(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setInfo(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailRetorno.trim(),
      password: senhaRetorno,
    })

    if (error || !data.user) {
      setErro('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    if (data.user.user_metadata?.tipo !== 'pai') {
      setErro('Esta conta não é de pai/responsável. Use a tela de login principal.')
      await supabase.auth.signOut()
      setLoading(false)
      return
    }

    router.push('/pais/perfil')
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
            onClick={() => { setAba('primeiro'); setErro(null); setInfo(null) }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'primeiro'
                ? 'bg-green-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Primeiro acesso
          </button>
          <button
            onClick={() => { setAba('retorno'); setErro(null); setInfo(null) }}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              aba === 'retorno'
                ? 'bg-green-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Já tenho conta
          </button>
        </div>

        {/* Primeiro acesso */}
        {aba === 'primeiro' && (
          <form onSubmit={handlePrimeiroAcesso} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código do atleta
              </label>
              <input
                required
                type="text"
                maxLength={3}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="001"
              />
              <p className="text-xs text-gray-400 mt-1">
                Peça o código de 3 dígitos ao treinador do seu filho.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seu email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crie uma senha</label>
              <input
                required
                type="password"
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
            {info && <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Criando acesso...' : 'Criar acesso'}
            </button>
          </form>
        )}

        {/* Retorno */}
        {aba === 'retorno' && (
          <form onSubmit={handleRetorno} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                required
                type="email"
                value={emailRetorno}
                onChange={(e) => setEmailRetorno(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="seu@email.com"
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

            {erro && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
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
