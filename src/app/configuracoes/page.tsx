'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export default function ConfiguracoesPage() {
  const [opcao, setOpcao] = useState<'app' | 'fora'>('fora')
  const [chavePix, setChavePix] = useState('')
  const [walletId, setWalletId] = useState('')
  const [mensalidadePadrao, setMensalidadePadrao] = useState('')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata) {
        setOpcao(user.user_metadata.opcao_recebimento ?? 'fora')
        setChavePix(user.user_metadata.chave_pix ?? '')
        setWalletId(user.user_metadata.asaas_wallet_id ?? '')
        setMensalidadePadrao(user.user_metadata.mensalidade_padrao?.toString() ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    setSucesso(false)

    if (opcao === 'app' && !chavePix.trim()) {
      setErro('Informe sua chave Pix para usar o recebimento pelo app.')
      setSalvando(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: {
        opcao_recebimento: opcao,
        chave_pix: opcao === 'app' ? chavePix.trim() : null,
        asaas_wallet_id: opcao === 'app' && walletId.trim() ? walletId.trim() : null,
        mensalidade_padrao: mensalidadePadrao ? parseFloat(mensalidadePadrao) : null,
      },
    })

    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setSucesso(true)
      setTimeout(() => setSucesso(false), 3000)
    }
    setSalvando(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie as configurações da sua conta</p>
        </div>

        <form onSubmit={salvar} className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Configuração de Recebimentos
            </h2>
            <p className="text-xs text-gray-400 mb-5">
              Escolha como deseja receber as mensalidades dos seus atletas.
            </p>

            {/* ── Opção A ── */}
            <label
              className={`block rounded-xl border-2 p-5 cursor-pointer mb-4 transition-colors ${
                opcao === 'app'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="opcao"
                  value="app"
                  checked={opcao === 'app'}
                  onChange={() => setOpcao('app')}
                  className="mt-1 accent-green-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Opção A — Receber pelo app</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Responsáveis pagam via Pix direto pelo app. Taxa de serviço: 3,99%.
                  </p>
                  <p className="text-xs text-amber-600 font-medium mt-1">
                    Exemplo: responsável paga R$150 → ScoutBase R$5,99 → Você R$144,01
                  </p>
                  <ul className="mt-3 space-y-1">
                    {[
                      'Atleta pausa automaticamente se não pagar até o vencimento',
                      'Acesso volta na hora após pagamento confirmado',
                      'Painel: quem pagou, quem está em atraso, quem está pausado',
                    ].map((b) => (
                      <li key={b} className="text-xs text-green-700 flex items-start gap-1.5">
                        <span className="mt-0.5">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </label>

            {/* Campos da Opção A */}
            {opcao === 'app' && (
              <div className="ml-6 space-y-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Chave Pix <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder="CPF, e-mail, celular ou chave aleatória"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Asaas Wallet ID{' '}
                    <span className="text-gray-400 font-normal">(opcional — para split automático)</span>
                  </label>
                  <input
                    type="text"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    placeholder="ex: 48548710-9baa-4ec1-a11f-9010193527c6"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Encontre em: app.asaas.com → Minha Conta → Identificadores
                  </p>
                </div>
              </div>
            )}

            {/* ── Opção B ── */}
            <label
              className={`block rounded-xl border-2 p-5 cursor-pointer transition-colors ${
                opcao === 'fora'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="opcao"
                  value="fora"
                  checked={opcao === 'fora'}
                  onChange={() => setOpcao('fora')}
                  className="mt-1 accent-green-600"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Opção B — Receber por fora</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Responsável paga direto para você como preferir (Pix pessoal, dinheiro, etc). Você
                    confirma manualmente na plataforma.
                  </p>
                  <ul className="mt-3 space-y-1">
                    {[
                      'Atleta só pausa se você marcar manualmente como inadimplente',
                      'Sem split — ScoutBase recebe apenas a assinatura do plano',
                    ].map((b) => (
                      <li key={b} className="text-xs text-gray-500 flex items-start gap-1.5">
                        <span className="mt-0.5">→</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </label>

            {/* Mensalidade padrão */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mensalidade padrão (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={mensalidadePadrao}
                onChange={(e) => setMensalidadePadrao(e.target.value)}
                placeholder="Ex: 150.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Valor sugerido ao gerar cobranças. Pode ser ajustado por atleta.
              </p>
            </div>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{erro}</p>
          )}
          {sucesso && (
            <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">
              ✓ Configurações salvas com sucesso.
            </p>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {salvando ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </form>
      </div>
    </div>
  )
}
