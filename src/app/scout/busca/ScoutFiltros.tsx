'use client'

import { useState } from 'react'

const POSICOES = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Meia-Atacante',
  'Ponta Direita', 'Ponta Esquerda', 'Atacante', 'Centro-Avante',
]

const CATEGORIAS = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto']

interface Props {
  posicaoFiltro?: string
  categoriaFiltro?: string
  cidadeFiltro?: string
}

function filtroUrl(
  posicao: string | undefined,
  categoria: string | undefined,
  cidade: string | undefined,
  campo: string,
  valor: string | null,
) {
  const p = new URLSearchParams()
  if (posicao   && campo !== 'posicao')   p.set('posicao',   posicao)
  if (categoria && campo !== 'categoria') p.set('categoria', categoria)
  if (cidade    && campo !== 'cidade')    p.set('cidade',    cidade)
  if (valor) p.set(campo, valor)
  const qs = p.toString()
  return `/scout/busca${qs ? `?${qs}` : ''}`
}

export default function ScoutFiltros({ posicaoFiltro, categoriaFiltro, cidadeFiltro }: Props) {
  const temFiltro = posicaoFiltro || categoriaFiltro || cidadeFiltro

  const [idInput,   setIdInput]   = useState('')
  const [idLoading, setIdLoading] = useState(false)
  const [idError,   setIdError]   = useState<string | null>(null)

  async function handleBuscarId(e: React.FormEvent) {
    e.preventDefault()
    const q = idInput.trim()
    if (!q) return
    setIdLoading(true)
    setIdError(null)
    try {
      const res  = await fetch(`/api/scout/buscar-id?q=${encodeURIComponent(q)}`)
      const json = await res.json() as { ok?: boolean; href?: string; error?: string }
      if (!res.ok || !json.href) { setIdError(json.error ?? 'ID não encontrado.'); return }
      window.location.href = json.href
    } catch {
      setIdError('Erro de conexão. Tente novamente.')
    } finally {
      setIdLoading(false)
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    fontSize: '14px', outline: 'none', cursor: 'pointer', appearance: 'none',
  }

  return (
    <>
    {/* ── Busca direta por ID ── */}
    <form onSubmit={handleBuscarId} style={{ marginBottom: '16px' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(34,197,94,0.02))',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '16px', padding: '16px 18px',
      }}>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(34,197,94,0.8)', textTransform: 'uppercase' }}>
          🎯 Buscar por ID
        </p>
        <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
          Digite o ID do atleta ou treinador para ir direto ao perfil.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={idInput}
            onChange={e => { setIdInput(e.target.value); setIdError(null) }}
            placeholder="Ex: 12345"
            autoCapitalize="characters"
            style={{
              flex: 1, padding: '11px 14px', borderRadius: '10px', fontSize: '15px',
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${idError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
              color: 'white', outline: 'none', fontFamily: 'system-ui, sans-serif',
              fontWeight: 700, letterSpacing: '0.04em',
            }}
          />
          <button
            type="submit"
            disabled={idLoading || !idInput.trim()}
            style={{
              padding: '11px 20px', borderRadius: '10px', border: 'none',
              background: idLoading ? 'rgba(34,197,94,0.4)' : '#22c55e',
              color: 'black', fontWeight: 800, fontSize: '14px', cursor: idLoading ? 'wait' : 'pointer',
              whiteSpace: 'nowrap', fontFamily: 'system-ui, sans-serif',
              opacity: (!idInput.trim() && !idLoading) ? 0.5 : 1,
              transition: 'opacity .15s',
            }}
          >
            {idLoading ? '…' : 'Ir →'}
          </button>
        </div>
        {idError && (
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#f87171', fontWeight: 600 }}>
            ⚠ {idError}
          </p>
        )}
      </div>
    </form>

    {/* ── Filtros por posição/categoria/cidade ── */}
    <div style={{
      background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px', padding: '18px', marginBottom: '24px',
      display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end',
    }}>
      {/* Posição */}
      <div style={{ flex: '1 1 160px' }}>
        <p style={{ margin: '0 0 7px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Posição
        </p>
        <select
          defaultValue={posicaoFiltro ?? ''}
          style={{ ...selectStyle, color: posicaoFiltro ? 'white' : 'rgba(255,255,255,0.4)' }}
          onChange={e => {
            const val = e.target.value
            window.location.href = filtroUrl(posicaoFiltro, categoriaFiltro, cidadeFiltro, 'posicao', val || null)
          }}
        >
          <option value="">Todas as posições</option>
          {POSICOES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Categoria */}
      <div style={{ flex: '1 1 140px' }}>
        <p style={{ margin: '0 0 7px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Categoria
        </p>
        <select
          defaultValue={categoriaFiltro ?? ''}
          style={{ ...selectStyle, color: categoriaFiltro ? 'white' : 'rgba(255,255,255,0.4)' }}
          onChange={e => {
            const val = e.target.value
            window.location.href = filtroUrl(posicaoFiltro, categoriaFiltro, cidadeFiltro, 'categoria', val || null)
          }}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Cidade — form GET */}
      <form
        method="get"
        action="/scout/busca"
        style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '7px' }}
      >
        {posicaoFiltro   && <input type="hidden" name="posicao"   value={posicaoFiltro} />}
        {categoriaFiltro && <input type="hidden" name="categoria" value={categoriaFiltro} />}
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Cidade
        </p>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            name="cidade"
            type="text"
            defaultValue={cidadeFiltro ?? ''}
            placeholder="Ex: São Paulo"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              color: 'white', fontSize: '14px', outline: 'none',
            }}
          />
          <button type="submit" style={{
            padding: '9px 14px', borderRadius: '10px', border: 'none',
            background: '#22c55e', color: 'black', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
          }}>
            Buscar
          </button>
        </div>
      </form>

      {/* Limpar filtros */}
      {temFiltro && (
        <a
          href="/scout/busca"
          style={{
            alignSelf: 'flex-end', padding: '9px 14px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)',
            fontSize: '13px', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          ✕ Limpar
        </a>
      )}
    </div>
    </>
  )
}
