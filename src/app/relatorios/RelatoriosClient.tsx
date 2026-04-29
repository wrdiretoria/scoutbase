'use client'

import { useState } from 'react'
import PremiumModal from '@/components/PremiumModal'

// ── Types ─────────────────────────────────────────────────────────────────────

type TipoRelatorio = 'responsavel' | 'olheiro' | 'evolucao'

type Atleta = {
  id: string
  nome: string
  posicao: string | null
  scout_id: string | null
  scoutScore: number | null   // 0–100
  ultimaAvaliacao: string | null
  totalAvaliacoes: number
  tecnico: number | null
  fisico: number | null
  tatico: number | null
  comportamento: number | null
}

type ResultadoRelatorio = {
  texto: string
  alunoNome: string
  scoutScore: string
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

// Render markdown-like bold (**text**) to JSX
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

// ── Report type configs ───────────────────────────────────────────────────────

const TIPOS: { id: TipoRelatorio; emoji: string; titulo: string; desc: string; tags: string[]; cor: string; corBg: string }[] = [
  {
    id: 'responsavel',
    emoji: '📄',
    titulo: 'Para os Responsáveis',
    desc: 'Boletim simples e humanizado gerado com IA — pontos fortes, áreas de melhoria e mensagem personalizada.',
    tags: ['Texto humanizado', 'WhatsApp', 'Link direto'],
    cor: 'border-blue-200 hover:border-blue-400',
    corBg: 'bg-blue-50',
  },
  {
    id: 'olheiro',
    emoji: '🔍',
    titulo: 'Para Olheiros',
    desc: 'Relatório técnico completo com histórico, Scout Score por categoria, QR Code e assinatura digital.',
    tags: ['QR Code', 'Dados verificados', 'Histórico completo'],
    cor: 'border-purple-200 hover:border-purple-400',
    corBg: 'bg-purple-50',
  },
  {
    id: 'evolucao',
    emoji: '📈',
    titulo: 'Evolução Mensal',
    desc: 'Análise comparativa mês a mês, evolução do Scout Score e pontos que mais cresceram.',
    tags: ['Tendências', 'Comparativo', 'Recomendações'],
    cor: 'border-green-200 hover:border-green-400',
    corBg: 'bg-green-50',
  },
]

// ── Radar mini SVG ────────────────────────────────────────────────────────────

function RadarMini({ t, f, ta, c }: { t: number; f: number; ta: number; c: number }) {
  const CX = 44, CY = 44, R = 32
  const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]
  const vals = [t, f, ta, c]
  const pts = vals.map((v, i) => {
    const r = (v / 10) * R
    return `${CX + r * Math.cos(ANGLES[i])},${CY + r * Math.sin(ANGLES[i])}`
  }).join(' ')
  const grid = ANGLES.map(a => `${CX + R * Math.cos(a)},${CY + R * Math.sin(a)}`).join(' ')
  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      <polygon points={grid} fill="none" stroke="#e5e7eb" strokeWidth="1" />
      {ANGLES.map((a, i) => (
        <line key={i} x1={CX} y1={CY} x2={CX + R * Math.cos(a)} y2={CY + R * Math.sin(a)} stroke="#e5e7eb" strokeWidth="1" />
      ))}
      <polygon points={pts} fill="rgba(34,197,94,0.2)" stroke="#16a34a" strokeWidth="1.5" />
    </svg>
  )
}

// ── QR Code ───────────────────────────────────────────────────────────────────

function QRCode({ value }: { value: string }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=166534`
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="QR Code de verificação" className="w-24 h-24 rounded-lg border border-gray-100" />
  )
}

// ── Score bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${(val / 10) * 100}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right">{val.toFixed(1)}</span>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({
  atleta, tipo, resultado, onClose,
}: {
  atleta: Atleta
  tipo: TipoRelatorio
  resultado: ResultadoRelatorio
  onClose: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const tipoConfig = TIPOS.find((t) => t.id === tipo)!
  const agora = new Date()
  const dataStr = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const linkVerificacao = `https://scoutbase-eta.vercel.app/atleta/${atleta.scout_id ?? atleta.id}`

  function copiarTexto() {
    navigator.clipboard.writeText(resultado.texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  function compartilharWhatsApp() {
    const msg = encodeURIComponent(
      `📊 *Relatório ScoutBase — ${atleta.nome}*\n\n${resultado.texto}\n\n🔗 Perfil: ${linkVerificacao}`
    )
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl my-4">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{tipoConfig.emoji}</span>
            <div>
              <h2 className="text-base font-bold text-gray-900">{tipoConfig.titulo}</h2>
              <p className="text-xs text-gray-400">{atleta.nome} · {dataStr}, {horaStr}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Athlete header */}
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${avatarBg(atleta.nome)}`}>
              {getInitials(atleta.nome)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900">{atleta.nome}</p>
              <p className="text-xs text-gray-500">{atleta.posicao ?? 'Posição não definida'} · {atleta.scout_id ?? '—'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Scout Score</p>
              <p className={`text-xl font-bold ${atleta.scoutScore !== null ? scoreColor(atleta.scoutScore) : 'text-gray-300'}`}>
                {resultado.scoutScore}/10
              </p>
            </div>
          </div>

          {/* Scores bars (olheiro only) */}
          {tipo === 'olheiro' && atleta.tecnico !== null && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scores por categoria</p>
              <ScoreBar label="Técnico"     val={atleta.tecnico}      color="bg-blue-500" />
              <ScoreBar label="Físico"      val={atleta.fisico!}      color="bg-green-500" />
              <ScoreBar label="Tático"      val={atleta.tatico!}      color="bg-purple-500" />
              <ScoreBar label="Comportamento" val={atleta.comportamento!} color="bg-orange-500" />
            </div>
          )}

          {/* AI Text */}
          <div className="prose prose-sm max-w-none">
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap space-y-1">
              {renderMarkdown(resultado.texto)}
            </div>
          </div>

          {/* QR + signature (olheiro only) */}
          {tipo === 'olheiro' && atleta.scout_id && (
            <div className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
              <QRCode value={linkVerificacao} />
              <div className="flex-1 min-w-0 text-xs text-gray-500 space-y-1.5">
                <p className="font-semibold text-gray-700">Verificação digital</p>
                <p>Scout ID: <span className="font-mono text-gray-900">{atleta.scout_id}</span></p>
                <p>Gerado em: {dataStr} às {horaStr}</p>
                <p>Avaliações: {atleta.totalAvaliacoes} registro{atleta.totalAvaliacoes !== 1 ? 's' : ''}</p>
                <p className="text-green-700 font-medium">✅ Dados verificados e autenticados</p>
                <a href={linkVerificacao} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline break-all">
                  {linkVerificacao}
                </a>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={copiarTexto}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copiado ? '✅ Copiado!' : '📋 Copiar texto'}
            </button>
            <button
              onClick={compartilharWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5c] text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

// Descrição premium por tipo
const PREMIUM_DESC: Record<TipoRelatorio, string> = {
  responsavel: 'Boletim humanizado gerado por IA com pontos fortes, áreas de melhoria e mensagem personalizada para os responsáveis.',
  olheiro: 'Relatório técnico completo com histórico, Scout Score por categoria, QR Code e assinatura digital para olheiros.',
  evolucao: 'Análise comparativa mês a mês, evolução do Scout Score e recomendações práticas de desenvolvimento.',
}

export default function RelatoriosClient({ atletas }: { atletas: Atleta[] }) {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio>('responsavel')
  const [gerando, setGerando] = useState<string | null>(null)    // alunoId sendo gerado
  const [modal, setModal] = useState<{ atleta: Atleta; tipo: TipoRelatorio; resultado: ResultadoRelatorio } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [premiumModal, setPremiumModal] = useState<{ funcao: string; descricao: string } | null>(null)

  async function gerarRelatorio(atleta: Atleta) {
    // Mostra o modal premium antes de gerar
    const tipoConfig = TIPOS.find((t) => t.id === tipoSelecionado)!
    setPremiumModal({
      funcao: tipoConfig.titulo,
      descricao: PREMIUM_DESC[tipoSelecionado],
    })
    return
    if (gerando) return
    setErro(null)
    setGerando(atleta.id)

    try {
      const res = await fetch('/api/relatorios/gerar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId: atleta.id, tipo: tipoSelecionado }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao gerar relatório')
      } else {
        setModal({ atleta, tipo: tipoSelecionado, resultado: data })
      }
    } catch {
      setErro('Falha de conexão. Tente novamente.')
    } finally {
      setGerando(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* ── Header ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gere relatórios com IA para enviar aos responsáveis ou mostrar a olheiros
          </p>
        </div>

        {/* ── Tipo de relatório ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Selecione o tipo de relatório
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TIPOS.map((tipo) => (
              <button
                key={tipo.id}
                onClick={() => setTipoSelecionado(tipo.id)}
                className={`relative text-left p-4 rounded-2xl border-2 transition-all ${
                  tipoSelecionado === tipo.id
                    ? `${tipo.corBg} ${tipo.cor.replace('hover:', '')} shadow-sm`
                    : `bg-white border-gray-100 hover:border-gray-200`
                }`}
              >
                {tipoSelecionado === tipo.id && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                <span className="text-2xl mb-2 block">{tipo.emoji}</span>
                <p className="text-sm font-bold text-gray-900 mb-1">{tipo.titulo}</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{tipo.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {tipo.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Atletas ── */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Escolha o atleta
          </p>

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
                  const isGerando = gerando === atleta.id
                  const temAvaliacao = atleta.totalAvaliacoes > 0
                  return (
                    <li key={atleta.id} className="px-4 py-4 flex items-center gap-3">
                      {/* Avatar + radar mini */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold ${avatarBg(atleta.nome)}`}>
                          {getInitials(atleta.nome)}
                        </div>
                        {atleta.tecnico !== null && (
                          <div className="absolute -bottom-1 -right-1">
                            <RadarMini
                              t={atleta.tecnico}
                              f={atleta.fisico ?? 0}
                              ta={atleta.tatico ?? 0}
                              c={atleta.comportamento ?? 0}
                            />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 ml-8">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">{atleta.nome}</p>
                          {atleta.scout_id && (
                            <span className="text-[10px] font-mono text-gray-400">{atleta.scout_id}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {atleta.posicao && <span className="text-xs text-gray-400">{atleta.posicao}</span>}
                          {atleta.scoutScore !== null && (
                            <span className={`text-xs font-bold ${scoreColor(atleta.scoutScore)}`}>
                              Score {(atleta.scoutScore / 10).toFixed(1)}
                            </span>
                          )}
                          {atleta.ultimaAvaliacao && (
                            <span className="text-xs text-gray-300">· {formatDate(atleta.ultimaAvaliacao)}</span>
                          )}
                          {!temAvaliacao && (
                            <span className="text-xs text-amber-500 font-medium">Sem avaliações</span>
                          )}
                        </div>
                      </div>

                      {/* Generate button */}
                      <button
                        onClick={() => gerarRelatorio(atleta)}
                        disabled={!temAvaliacao || !!gerando}
                        title={!temAvaliacao ? 'Atleta sem avaliações' : `Gerar ${TIPOS.find(t => t.id === tipoSelecionado)?.titulo}`}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all min-h-[36px] ${
                          !temAvaliacao
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            : isGerando
                            ? 'bg-green-50 text-green-500 cursor-wait'
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-sm active:scale-95'
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
                            <span className="hidden sm:inline">Gerar com IA</span>
                            <span className="sm:hidden">IA</span>
                          </>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* ── Erro ── */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-red-500 text-sm">⚠️</span>
            <p className="text-sm text-red-700">{erro}</p>
          </div>
        )}

        {/* ── Footer verificação ── */}
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-green-600 text-lg flex-shrink-0">🔐</span>
          <div>
            <p className="text-sm font-semibold text-green-800">Dados verificados e autenticados</p>
            <p className="text-xs text-green-700 mt-0.5">
              Todos os relatórios contêm data, hora e assinatura digital do treinador.
              Os dados de avaliação não podem ser alterados retroativamente.
            </p>
          </div>
        </div>

      </div>

      {/* ── Modal resultado ── */}
      {modal && (
        <Modal
          atleta={modal.atleta}
          tipo={modal.tipo}
          resultado={modal.resultado}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── Modal premium ── */}
      {premiumModal && (
        <PremiumModal
          funcao={premiumModal.funcao}
          descricao={premiumModal.descricao}
          onClose={() => setPremiumModal(null)}
        />
      )}
    </div>
  )
}
