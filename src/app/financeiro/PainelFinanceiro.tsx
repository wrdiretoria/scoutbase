'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { calcularSplit } from '@/lib/asaas'
import PremiumModal from '@/components/PremiumModal'

type Aluno = {
  id: string
  nome: string
  posicao: string | null
  status_pagamento: string | null
  mensalidade: number | null
  asaas_customer_id: string | null
  turmas: { nome: string } | null
}

type Pagamento = {
  id: string
  aluno_id: string
  valor: number
  status: string
  competencia: string | null
  vencimento: string | null
  data_pagamento: string | null
  asaas_link: string | null
}

type Props = {
  alunos: Aluno[]
  pagamentos: Pagamento[]
  opcaoRecebimento: 'app' | 'fora'
  mensalidadePadrao: number
  walletId: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  em_dia: { label: 'Em dia', color: 'bg-green-100 text-green-700' },
  atraso: { label: 'Em atraso', color: 'bg-red-100 text-red-700' },
  pausado: { label: 'Pausado', color: 'bg-gray-100 text-gray-600' },
}

export default function PainelFinanceiro({
  alunos: alunosIniciais,
  pagamentos: pagamentosIniciais,
  opcaoRecebimento,
  mensalidadePadrao,
  walletId,
}: Props) {
  const [alunos, setAlunos] = useState(alunosIniciais)
  const [pagamentos, setPagamentos] = useState(pagamentosIniciais)
  const [atualizando, setAtualizando] = useState<string | null>(null)
  const [gerandoCobranca, setGerandoCobranca] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [showPremium, setShowPremium] = useState(true)

  const emDia = alunos.filter((a) => !a.status_pagamento || a.status_pagamento === 'em_dia').length
  const emAtraso = alunos.filter((a) => a.status_pagamento === 'atraso').length
  const pausados = alunos.filter((a) => a.status_pagamento === 'pausado').length

  async function atualizarStatus(alunoId: string, novoStatus: string) {
    setAtualizando(alunoId)
    setErro(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('alunos')
      .update({ status_pagamento: novoStatus })
      .eq('id', alunoId)

    if (error) {
      setErro('Erro ao atualizar status.')
    } else {
      setAlunos((prev) =>
        prev.map((a) => (a.id === alunoId ? { ...a, status_pagamento: novoStatus } : a))
      )
    }
    setAtualizando(null)
  }

  async function gerarCobranca(aluno: Aluno) {
    setGerandoCobranca(aluno.id)
    setErro(null)

    const valor = aluno.mensalidade ?? mensalidadePadrao
    if (!valor || valor <= 0) {
      setErro(`Configure a mensalidade do atleta ${aluno.nome} antes de gerar a cobrança.`)
      setGerandoCobranca(null)
      return
    }

    const hoje = new Date()
    const vencimento = new Date(hoje.getFullYear(), hoje.getMonth(), 10)
    if (vencimento < hoje) vencimento.setMonth(vencimento.getMonth() + 1)
    const vencimentoStr = vencimento.toISOString().split('T')[0]
    const competencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

    const res = await fetch('/api/asaas/cobranca', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        aluno_id: aluno.id,
        nome_aluno: aluno.nome,
        valor,
        vencimento: vencimentoStr,
        competencia,
        wallet_id: walletId,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setErro(data.error ?? 'Erro ao gerar cobrança.')
    } else {
      setPagamentos((prev) => [data.pagamento, ...prev])
    }
    setGerandoCobranca(null)
  }

  async function copiarLink(link: string, id: string) {
    await navigator.clipboard.writeText(link)
    setLinkCopiado(id)
    setTimeout(() => setLinkCopiado(null), 2000)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">
          {opcaoRecebimento === 'app'
            ? 'Recebimento pelo app — cobranças automáticas via Asaas'
            : 'Recebimento por fora — confirmação manual'}
        </p>
      </div>

      {/* Aviso Opção B */}
      {opcaoRecebimento === 'fora' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-medium text-amber-800">
              Você está recebendo por fora.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Ative o recebimento pelo app em{' '}
              <a href="/configuracoes" className="underline font-medium">
                Configurações
              </a>{' '}
              para automatizar suas cobranças.
            </p>
          </div>
        </div>
      )}

      {erro && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {erro}
        </p>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400">Em dia</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{emDia}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400">Em atraso</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{emAtraso}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs text-gray-400">Pausados</p>
          <p className="text-3xl font-bold text-gray-400 mt-1">{pausados}</p>
        </div>
      </div>

      {/* Tabela de atletas */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Atletas</h2>
        </div>

        {alunos.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-sm">Nenhum atleta cadastrado ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {alunos.map((aluno) => {
              const status = aluno.status_pagamento ?? 'em_dia'
              const statusInfo = STATUS_LABELS[status] ?? STATUS_LABELS.em_dia
              const valor = aluno.mensalidade ?? mensalidadePadrao
              const { treinador } = calcularSplit(valor)
              const pagamentoAtivo = pagamentos.find(
                (p) => p.aluno_id === aluno.id && p.status === 'pendente'
              )
              const isAtualizando = atualizando === aluno.id
              const isGerando = gerandoCobranca === aluno.id

              return (
                <li key={aluno.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{aluno.nome}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {aluno.turmas?.nome ?? 'Sem turma'} ·{' '}
                        {valor > 0 ? `R$${valor.toFixed(2)}/mês` : 'Sem mensalidade'}
                        {opcaoRecebimento === 'app' && valor > 0 && (
                          <span className="text-gray-300">
                            {' '}(você recebe R${treinador.toFixed(2)})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {opcaoRecebimento === 'fora' ? (
                        <>
                          <button
                            onClick={() => atualizarStatus(aluno.id, 'em_dia')}
                            disabled={isAtualizando || status === 'em_dia'}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-200 text-green-700 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            ✓ Marcar pago
                          </button>
                          <button
                            onClick={() => atualizarStatus(aluno.id, 'atraso')}
                            disabled={isAtualizando || status === 'atraso'}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Inadimplente
                          </button>
                          <button
                            onClick={() => atualizarStatus(aluno.id, 'pausado')}
                            disabled={isAtualizando || status === 'pausado'}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Pausar
                          </button>
                        </>
                      ) : (
                        <>
                          {pagamentoAtivo?.asaas_link ? (
                            <button
                              onClick={() => copiarLink(pagamentoAtivo.asaas_link!, pagamentoAtivo.id)}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
                            >
                              {linkCopiado === pagamentoAtivo.id ? '✓ Copiado!' : '🔗 Copiar link'}
                            </button>
                          ) : (
                            <button
                              onClick={() => gerarCobranca(aluno)}
                              disabled={isGerando || valor <= 0}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              {isGerando ? 'Gerando...' : 'Gerar cobrança'}
                            </button>
                          )}
                          <button
                            onClick={() => atualizarStatus(aluno.id, 'pausado')}
                            disabled={isAtualizando || status === 'pausado'}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Pausar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Histórico de cobranças */}
      {pagamentos.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-sm font-semibold text-gray-900">Histórico de cobranças</h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {pagamentos.slice(0, 20).map((p) => {
              const aluno = alunos.find((a) => a.id === p.aluno_id)
              return (
                <li key={p.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-800">{aluno?.nome ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {p.competencia ?? ''}{' '}
                      {p.vencimento
                        ? `· vence ${new Date(p.vencimento).toLocaleDateString('pt-BR')}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'pago'
                          ? 'bg-green-100 text-green-700'
                          : p.status === 'vencido'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {p.status === 'pago' ? 'Pago' : p.status === 'vencido' ? 'Vencido' : 'Pendente'}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      R${p.valor.toFixed(2)}
                    </span>
                    {p.asaas_link && (
                      <a
                        href={p.asaas_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* ── Modal Premium ── */}
      {showPremium && (
        <PremiumModal
          funcao="Painel Financeiro"
          descricao="Controle mensalidades, inadimplência, cobranças automáticas e fluxo financeiro completo da sua escolinha."
          onClose={() => setShowPremium(false)}
        />
      )}
    </div>
  )
}
