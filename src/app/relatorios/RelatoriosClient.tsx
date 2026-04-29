'use client'

import { useState } from 'react'
import PremiumModal from '@/components/PremiumModal'

// ── Types ─────────────────────────────────────────────────────────────────────

type Atleta = {
  id: string
  nome: string
  posicao: string | null
  scout_id: string | null
  scoutScore: number | null   // 0–100 raw
  ultimaAvaliacao: string | null
  totalAvaliacoes: number
  tecnico: number | null
  fisico: number | null
  tatico: number | null
  comportamento: number | null
  evolucao: number | null     // delta em display (ex: +0.3)
  freqMes: number | null      // percentual 0-100
}

type Resultado = {
  texto: string
  alunoNome: string
  scoutScore: string
  scoreAnterior: string | null
  tecnico: number
  fisico: number
  tatico: number
  comportamento: number
  freqMes: number | null
}

// ── Freemium ──────────────────────────────────────────────────────────────────

const LIMITE_GRATIS = 3

function usageKey() {
  const m = new Date()
  return `sb_rpts_${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
}

function getUsados(): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(usageKey()) ?? '0', 10)
}

function incrementar() {
  const k = usageKey()
  localStorage.setItem(k, String(getUsados() + 1))
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase()
}

function avatarBg(nome: string) {
  const colors = ['bg-green-500','bg-blue-500','bg-purple-500','bg-orange-500','bg-teal-500','bg-pink-500','bg-indigo-500','bg-amber-500']
  let h = 0
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-blue-600'
  return 'text-red-500'
}

function scoreBgBar(score: number) {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  return 'bg-red-400'
}

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, li) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <span key={li}>
        {parts.map((part, pi) =>
          pi % 2 === 1 ? <strong key={pi} className="font-semibold text-gray-900">{part}</strong> : part
        )}
        {li < lines.length - 1 && <br />}
      </span>
    )
  })
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, val, cor }: { label: string; val: number; cor: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${cor}`} style={{ width: `${(val / 10) * 100}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right">{val.toFixed(1)}</span>
    </div>
  )
}

// ── QR Code ───────────────────────────────────────────────────────────────────

function QRCode({ value }: { value: string }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=166534`
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="QR Code" className="w-24 h-24 rounded-lg border border-gray-100" />
}

// ── Modal do Relatório ────────────────────────────────────────────────────────

function ModalRelatorio({
  atleta,
  resultado,
  onClose,
}: {
  atleta: Atleta
  resultado: Resultado
  onClose: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const agora    = new Date()
  const dataStr  = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const horaStr  = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const linkPublico = atleta.scout_id
    ? `https://scoutbase-eta.vercel.app/relatorio/${atleta.scout_id}`
    : `https://scoutbase-eta.vercel.app/atleta/${atleta.id}`

  const evolDisplay = resultado.scoreAnterior
    ? `${resultado.scoreAnterior} → ${resultado.scoutScore}`
    : null

  function copiarTexto() {
    navigator.clipboard.writeText(resultado.texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function copiarLink() {
    navigator.clipboard.writeText(linkPublico)
    setLinkCopiado(true)
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  function compartilharWhatsApp() {
    const msg = encodeURIComponent(
      `📊 *Relatório Mensal ScoutBase*\n\n*${atleta.nome}*\n` +
      `Scout Score: ${resultado.scoutScore}/10\n` +
      (resultado.freqMes !== null ? `Frequência: ${resultado.freqMes}%\n` : '') +
      `\n${resultado.texto}\n\n🔗 Perfil: ${linkPublico}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-4 pt-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg(atleta.nome)}`}>
              {getInitials(atleta.nome)}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{atleta.nome}</h2>
              <p className="text-xs text-gray-400">{dataStr} · {horaStr}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Scores resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 sm:col-span-1 bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Scout Score</p>
              <p className="text-2xl font-bold text-green-600">{resultado.scoutScore}<span className="text-sm font-normal text-gray-400">/10</span></p>
              {evolDisplay && (
                <p className="text-xs text-gray-400 mt-0.5">{evolDisplay}</p>
              )}
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Frequência</p>
              <p className="text-lg font-bold text-gray-800">
                {resultado.freqMes !== null ? `${resultado.freqMes}%` : '—'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-0.5">Posição</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{atleta.posicao ?? '—'}</p>
            </div>
          </div>

          {/* Score bars por categoria */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Por categoria</p>
            <ScoreBar label="Técnico"       val={resultado.tecnico}       cor="bg-blue-500" />
            <ScoreBar label="Físico"         val={resultado.fisico}        cor="bg-green-500" />
            <ScoreBar label="Tático"         val={resultado.tatico}        cor="bg-purple-500" />
            <ScoreBar label="Comportamento"  val={resultado.comportamento} cor="bg-orange-500" />
          </div>

          {/* AI text */}
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {renderMarkdown(resultado.texto)}
          </div>

          {/* QR + assinatura */}
          {atleta.scout_id && (
            <div className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
              <QRCode value={linkPublico} />
              <div className="flex-1 text-xs text-gray-500 space-y-1.5">
                <p className="font-semibold text-gray-700">Verificação digital</p>
                <p>Scout ID: <span className="font-mono text-gray-900">{atleta.scout_id}</span></p>
                <p>Gerado em: {dataStr} às {horaStr}</p>
                <p>Avaliações: {atleta.totalAvaliacoes} registro{atleta.totalAvaliacoes !== 1 ? 's' : ''}</p>
                <p className="text-green-700 font-medium">✅ Dados verificados</p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={compartilharWhatsApp}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5c] text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </button>
            <button
              onClick={copiarLink}
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {linkCopiado ? '✅ Link copiado!' : '🔗 Copiar link'}
            </button>
          </div>
          <button
            onClick={copiarTexto}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-100 text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {copiado ? '✅ Texto copiado!' : '📋 Copiar texto completo'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RelatoriosClient({ atletas }: { atletas: Atleta[] }) {
  const [gerando,      setGerando]      = useState<string | null>(null)
  const [modal,        setModal]        = useState<{ atleta: Atleta; resultado: Resultado } | null>(null)
  const [erro,         setErro]         = useState<string | null>(null)
  const [showPremium,  setShowPremium]  = useState(false)

  async function gerarRelatorio(atleta: Atleta) {
    // Freemium check
    if (getUsados() >= LIMITE_GRATIS) {
      setShowPremium(true)
      return
    }

    if (gerando) return
    setErro(null)
    setGerando(atleta.id)

    try {
      const res = await fetch('/api/relatorios/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId: atleta.id, freqMes: atleta.freqMes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao gerar relatório')
      } else {
        incrementar()
        setModal({ atleta, resultado: data as Resultado })
      }
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setGerando(null)
    }
  }

  const usados    = getUsados()
  const restantes = Math.max(0, LIMITE_GRATIS - usados)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gere o relatório mensal de cada atleta com IA
            </p>
          </div>
          {/* Contador gratuito */}
          {restantes > 0 ? (
            <div className="flex-shrink-0 text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-100 text-xs font-semibold text-green-700">
                ✨ {restantes} grátis restante{restantes !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowPremium(true)}
              className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              ⭐ Ver plano
            </button>
          )}
        </div>

        {/* ── Lista de atletas ── */}
        {atletas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">Nenhum atleta cadastrado.</p>
            <p className="text-gray-400 text-sm mt-1">Cadastre atletas e faça avaliações para gerar relatórios.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <ul className="divide-y divide-gray-50">
              {atletas.map((atleta) => {
                const isGerando  = gerando === atleta.id
                const temAval    = atleta.totalAvaliacoes > 0
                const scoreDisp  = atleta.scoutScore !== null
                  ? (atleta.scoutScore / 10).toFixed(1)
                  : null

                return (
                  <li key={atleta.id} className="px-4 py-4 flex items-center gap-3">

                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg(atleta.nome)}`}>
                      {getInitials(atleta.nome)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900 truncate">{atleta.nome}</p>
                        {atleta.scout_id && (
                          <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">{atleta.scout_id}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {atleta.posicao && (
                          <span className="text-xs text-gray-400">{atleta.posicao}</span>
                        )}
                        {scoreDisp && (
                          <span className={`text-xs font-bold ${scoreColor(atleta.scoutScore!)}`}>
                            {scoreDisp}
                          </span>
                        )}
                        {atleta.evolucao !== null && (
                          <span className={`text-xs font-medium ${atleta.evolucao >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                            {atleta.evolucao >= 0 ? '↑' : '↓'}{Math.abs(atleta.evolucao)}
                          </span>
                        )}
                        {atleta.freqMes !== null && (
                          <span className="text-xs text-gray-400">· {atleta.freqMes}% freq.</span>
                        )}
                        {atleta.ultimaAvaliacao && (
                          <span className="text-xs text-gray-300 hidden sm:inline">· {formatDate(atleta.ultimaAvaliacao)}</span>
                        )}
                        {!temAval && (
                          <span className="text-xs text-amber-500 font-medium">Sem avaliações</span>
                        )}
                      </div>
                    </div>

                    {/* Botão */}
                    <button
                      onClick={() => gerarRelatorio(atleta)}
                      disabled={!temAval || !!gerando}
                      title={!temAval ? 'Atleta sem avaliações' : 'Gerar relatório mensal'}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                        !temAval
                          ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          : isGerando
                          ? 'bg-green-50 text-green-500 cursor-wait'
                          : 'bg-[#16a34a] hover:bg-green-600 text-white shadow-sm active:scale-95'
                      }`}
                    >
                      {isGerando ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span className="hidden sm:inline">Gerando…</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span className="hidden sm:inline">Gerar Relatório</span>
                          <span className="sm:hidden">Gerar</span>
                        </>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* ── Erro ── */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-red-500 text-sm">⚠️</span>
            <p className="text-sm text-red-700">{erro}</p>
          </div>
        )}

        {/* ── Info verificação ── */}
        <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-green-600 text-lg flex-shrink-0">🔐</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Relatório com assinatura digital</p>
            <p className="text-xs text-green-700 mt-0.5">
              Cada relatório contém data, hora, Scout Score e QR Code de verificação —
              pronto para enviar aos responsáveis ou apresentar a olheiros.
            </p>
          </div>
        </div>

      </div>

      {/* ── Modal relatório ── */}
      {modal && (
        <ModalRelatorio
          atleta={modal.atleta}
          resultado={modal.resultado}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Modal premium ── */}
      {showPremium && (
        <PremiumModal
          funcao="Relatórios Ilimitados"
          descricao="Você usou seus 3 relatórios gratuitos deste mês. Assine para gerar relatórios ilimitados para todos os seus atletas, todo mês."
          onClose={() => setShowPremium(false)}
        />
      )}
    </div>
  )
}
