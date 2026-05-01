'use client'

import Link from 'next/link'

export type PremiumModalProps = {
  /** Nome curto da função, ex: "Relatório com IA" */
  funcao: string
  /** Uma linha descrevendo o que a função faz */
  descricao: string
  onClose: () => void
}

export default function PremiumModal({ funcao, descricao, onClose }: PremiumModalProps) {
  return (
    <>
      {/* Keyframe inline — fade + scale suave */}
      <style>{`
        @keyframes pm-in {
          from { opacity: 0; transform: scale(0.93) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .pm-card { animation: pm-in 0.22s cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        {/* Card */}
        <div className="pm-card relative w-full max-w-sm bg-white rounded-[20px] shadow-2xl overflow-hidden">

          {/* Top stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#16a34a] to-green-400" />

          {/* Body */}
          <div className="px-7 pt-7 pb-8 text-center">

            {/* Star icon */}
            <div className="w-14 h-14 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-5">
              <span className="text-2xl">⭐</span>
            </div>

            {/* Labels */}
            <p className="text-xs font-bold text-[#16a34a] uppercase tracking-widest mb-1">
              Função Premium
            </p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{funcao}</h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">{descricao}</p>

            {/* Price */}
            <div className="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 mb-6">
              <p className="text-xs text-gray-400 mb-0.5">A partir de</p>
              <p className="text-3xl font-bold text-gray-900">
                R$47<span className="text-base font-normal text-gray-400">/mês</span>
              </p>
              <p className="text-xs text-green-700 mt-1 font-medium">✓ Cancele quando quiser</p>
            </div>

            {/* CTA */}
            <Link
              href="/financeiro"
              className="block w-full py-3.5 rounded-2xl bg-[#16a34a] hover:bg-green-500 text-white text-sm font-bold transition-colors shadow-md shadow-green-200"
            >
              Assinar agora →
            </Link>

            {/* Ver planos */}
            <Link
              href="/financeiro"
              className="block mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Ver todos os planos
            </Link>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
