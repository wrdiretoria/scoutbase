'use client'

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

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    fontSize: '14px', outline: 'none', cursor: 'pointer', appearance: 'none',
  }

  return (
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
  )
}
