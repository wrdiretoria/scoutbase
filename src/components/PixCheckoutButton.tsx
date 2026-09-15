'use client'

/**
 * Botão de assinatura/compra usado na página /planos — mesmo padrão visual
 * de exibição do Pix já usado em /atleta/promover: gera a cobrança, mostra
 * QR code + código copia-e-cola inline, sem sair da página.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PixData = { pixCode: string; qrCodeImage: string; valor: number }

export default function PixCheckoutButton({ produto, label, corPrimaria }: {
  produto: 'atleta_pro' | 'treinador_pro' | 'clube' | 'boost'
  label: string
  corPrimaria?: string
}) {
  const router = useRouter()
  const [gerando, setGerando] = useState(false)
  const [pix, setPix]         = useState<PixData | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro]       = useState<string | null>(null)

  const cor = corPrimaria ?? '#22c55e'

  async function handleClick() {
    if (gerando) return
    setGerando(true)
    setErro(null)
    try {
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produto }),
      })
      if (res.status === 401) { router.push('/login'); return }
      const data = await res.json() as { pixCode?: string; qrCodeImage?: string; valor?: number; error?: string }
      if (!res.ok || !data.pixCode || !data.qrCodeImage || data.valor === undefined) {
        setErro(data.error ?? 'Não foi possível gerar a cobrança.')
        return
      }
      setPix({ pixCode: data.pixCode, qrCodeImage: data.qrCodeImage, valor: data.valor })
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setGerando(false)
    }
  }

  async function copiar() {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix.pixCode)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      window.prompt('Copie o código Pix:', pix.pixCode)
    }
  }

  if (pix) {
    return (
      <div style={{
        padding: '16px', borderRadius: '14px', textAlign: 'center',
        background: 'rgba(255,255,255,0.03)', border: `1px solid ${cor}40`,
      }}>
        <p style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
          Escaneie o QR code ou copie o código Pix
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${pix.qrCodeImage}`}
          alt="QR code Pix"
          style={{ width: '160px', height: '160px', margin: '0 auto 10px', borderRadius: '10px', background: 'white', padding: '6px' }}
        />
        <p style={{ margin: '0 0 10px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', wordBreak: 'break-all' }}>
          {pix.pixCode.slice(0, 50)}…
        </p>
        <button
          onClick={copiar}
          style={{
            width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
            background: copiado ? 'rgba(34,197,94,0.2)' : cor,
            color: copiado ? cor : 'black', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {copiado ? '✓ Código copiado!' : `Copiar código Pix — R$ ${pix.valor.toFixed(2).replace('.', ',')}`}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <button
        onClick={handleClick}
        disabled={gerando}
        style={{
          display: 'block', width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          textAlign: 'center', background: cor, color: 'black',
          fontWeight: 800, fontSize: '14px', cursor: gerando ? 'default' : 'pointer',
          opacity: gerando ? 0.7 : 1, fontFamily: 'system-ui, sans-serif',
        }}
      >
        {gerando ? 'Gerando cobrança…' : label}
      </button>
      {erro && (
        <p style={{ margin: 0, fontSize: '11px', color: '#f87171', textAlign: 'center' }}>{erro}</p>
      )}
    </div>
  )
}
