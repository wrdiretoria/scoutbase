'use client'

import { useState } from 'react'
import type { RelatorioPDFProps } from './RelatorioPDF'

export default function ExportarPDFButton(props: RelatorioPDFProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const [{ pdf }, React, { RelatorioPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('react'),
        import('./RelatorioPDF'),
      ])

      const element = React.createElement(RelatorioPDF, props) as Parameters<typeof pdf>[0]
      const blob = await pdf(element).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio-${props.nomeAluno.toLowerCase().replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="block w-full text-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
    >
      {loading ? 'Gerando PDF...' : 'Exportar PDF'}
    </button>
  )
}
