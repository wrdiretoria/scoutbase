/**
 * /scout/busca — Busca de atletas para scouts
 * Server Component — filtros via searchParams
 */

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcularIdade(dataNasc: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function calcularCategoria(dataNasc: string): string {
  const idade = calcularIdade(dataNasc)
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

function calcularOVR(nome: string): number {
  const hash = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return 68 + (hash % 13)
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

const POSICOES = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Meia-Atacante',
  'Ponta Direita', 'Ponta Esquerda', 'Atacante', 'Centro-Avante',
]

const CATEGORIAS = ['Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto']

// ── Page ─────────────────────────────────────────────────────────────────────

type Props = { searchParams: Promise<{ posicao?: string; categoria?: string; cidade?: string }> }

export default async function ScoutBuscaPage({ searchParams }: Props) {
  const { posicao: posicaoFiltro, categoria: categoriaFiltro, cidade: cidadeFiltro } = await searchParams

  const admin = createAdminClient()

  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const atletaUsers = users.filter(u => u.user_metadata?.tipo === 'atleta')

  const ids = atletaUsers.map(u => u.id)
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, data_nascimento, bio, altura, peso, pe_dominante, clube_atual')
    .in('id', ids)

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const atletas = atletaUsers
    .map(u => {
      const meta = u.user_metadata as { nome?: string; posicao?: string; cidade?: string }
      const nome = meta.nome ?? 'Atleta'
      const p = profileMap.get(u.id)
      const dataNasc = (p?.data_nascimento as string | null) ?? null
      return {
        id: u.id,
        nome,
        posicao:     meta.posicao ?? '',
        cidade:      meta.cidade  ?? '',
        ovr:         calcularOVR(nome),
        pos:         posAbrev(meta.posicao ?? ''),
        categoria:   dataNasc ? calcularCategoria(dataNasc) : null,
        idade:       dataNasc ? calcularIdade(dataNasc) : null,
        bio:         (p?.bio as string | null) ?? null,
        altura:      (p?.altura as number | null) ?? null,
        peso:        (p?.peso as number | null) ?? null,
        peDominante: (p?.pe_dominante as string | null) ?? null,
        clubeAtual:  (p?.clube_atual as string | null) ?? null,
        initials:    getInitials(nome),
      }
    })
    .sort((a, b) => b.ovr - a.ovr)

  // Aplica filtros
  const filtered = atletas.filter(a => {
    if (posicaoFiltro && a.posicao !== posicaoFiltro) return false
    if (categoriaFiltro && a.categoria !== categoriaFiltro) return false
    if (cidadeFiltro && !a.cidade.toLowerCase().includes(cidadeFiltro.toLowerCase())) return false
    return true
  })

  // Monta query string sem o campo sendo resetado
  function filtroUrl(campo: string, valor: string | null) {
    const p = new URLSearchParams()
    if (posicaoFiltro  && campo !== 'posicao')   p.set('posicao',  posicaoFiltro)
    if (categoriaFiltro && campo !== 'categoria') p.set('categoria', categoriaFiltro)
    if (cidadeFiltro   && campo !== 'cidade')     p.set('cidade',   cidadeFiltro)
    if (valor) p.set(campo, valor)
    const qs = p.toString()
    return `/scout/busca${qs ? `?${qs}` : ''}`
  }

  const temFiltro = posicaoFiltro || categoriaFiltro || cidadeFiltro

  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      <style>{`
        .scout-card { transition: border-color 0.18s, background 0.18s; }
        .scout-card:hover { border-color: rgba(34,197,94,0.3) !important; background: rgba(34,197,94,0.04) !important; }
        .pill-btn { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        select option { background: #0b1610; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(6,16,10,0.95)',
        backdropFilter: 'blur(16px)', zIndex: 50,
      }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, color: 'white', textDecoration: 'none', letterSpacing: '0.03em' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
            Área do Scout
          </span>
          <Link href="/scout/cadastro" style={{
            padding: '7px 14px', borderRadius: '8px', background: '#22c55e',
            color: 'black', fontWeight: 800, fontSize: '12px', textDecoration: 'none',
          }}>
            Criar conta
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '28px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            🔍 Busca de talentos
          </p>
          <h1 style={{ margin: '0 0 4px', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em' }}>
            Encontre o próximo craque
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {filtered.length} atleta{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            {temFiltro ? ' com os filtros aplicados' : ' na base'}
          </p>
        </div>

        {/* ── Filtros ── */}
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
              onChange={e => {
                const val = e.target.value
                window.location.href = filtroUrl('posicao', val || null)
              }}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: posicaoFiltro ? 'white' : 'rgba(255,255,255,0.4)',
                fontSize: '14px', outline: 'none', cursor: 'pointer', appearance: 'none',
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
              onChange={e => {
                const val = e.target.value
                window.location.href = filtroUrl('categoria', val || null)
              }}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                color: categoriaFiltro ? 'white' : 'rgba(255,255,255,0.4)',
                fontSize: '14px', outline: 'none', cursor: 'pointer', appearance: 'none',
              }}
            >
              <option value="">Todas as categorias</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Cidade — form GET simples */}
          <form
            method="get"
            action="/scout/busca"
            style={{ flex: '1 1 160px', display: 'flex', flexDirection: 'column', gap: '7px' }}
            onSubmit={e => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              const cidade = fd.get('cidade') as string
              window.location.href = filtroUrl('cidade', cidade || null)
            }}
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
            <Link href="/scout/busca" style={{
              alignSelf: 'flex-end', padding: '9px 14px', borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)',
              fontSize: '13px', textDecoration: 'none', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              ✕ Limpar
            </Link>
          )}
        </div>

        {/* ── Resultados ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)' }}>
            <p style={{ fontSize: '32px', margin: '0 0 10px' }}>🔍</p>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Nenhum atleta encontrado</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px' }}>Tente ajustar os filtros</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(atleta => (
              <Link
                key={atleta.id}
                href={`/jogador/${atleta.id}`}
                className="scout-card"
                style={{
                  display: 'block', textDecoration: 'none', color: 'white',
                  background: '#0b1610', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px', padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                  {/* Avatar + OVR */}
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '50%',
                      background: 'linear-gradient(135deg,#15803d,#4ade80)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '16px', fontWeight: 900,
                      boxShadow: '0 4px 14px rgba(34,197,94,0.25)',
                      marginBottom: '6px',
                    }}>
                      {atleta.initials}
                    </div>
                    <div style={{
                      fontSize: '18px', fontWeight: 900, color: '#22c55e', lineHeight: 1,
                    }}>
                      {atleta.ovr}
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      OVR
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {atleta.nome}
                      </h2>
                      {atleta.categoria && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, color: '#4ade80',
                          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
                          borderRadius: '6px', padding: '2px 8px', whiteSpace: 'nowrap',
                        }}>
                          {atleta.categoria}
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
                      {atleta.pos}{atleta.posicao !== atleta.pos ? ` · ${atleta.posicao}` : ''}
                      {atleta.cidade ? ` · ${atleta.cidade}` : ''}
                      {atleta.idade  ? ` · ${atleta.idade} anos` : ''}
                    </p>

                    {/* Físico inline */}
                    {(atleta.altura || atleta.peso || atleta.peDominante) && (
                      <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                        {[
                          atleta.altura      ? `${atleta.altura}cm`              : null,
                          atleta.peso        ? `${atleta.peso}kg`                : null,
                          atleta.peDominante ? `Pé ${atleta.peDominante.toLowerCase()}` : null,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    {atleta.clubeAtual && (
                      <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                        ⚽ {atleta.clubeAtual}
                      </p>
                    )}

                    {/* Bio preview */}
                    {atleta.bio && (
                      <p style={{
                        margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)',
                        lineHeight: 1.5, fontStyle: 'italic',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                      }}>
                        "{atleta.bio}"
                      </p>
                    )}
                  </div>

                  {/* Seta */}
                  <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '18px', flexShrink: 0, alignSelf: 'center' }}>›</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* ── CTA para scouts sem conta ── */}
        <div style={{
          marginTop: '40px', padding: '24px', borderRadius: '20px',
          background: 'linear-gradient(135deg,#052e16,#0b1610)',
          border: '1px solid rgba(34,197,94,0.18)', textAlign: 'center',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900 }}>
            Quer salvar buscas e contatar atletas?
          </p>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Crie sua conta de scout gratuitamente.
          </p>
          <Link href="/scout/cadastro" style={{
            display: 'inline-block', padding: '13px 28px', borderRadius: '14px',
            background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '15px', textDecoration: 'none',
          }}>
            Criar conta de scout →
          </Link>
        </div>
      </div>
    </main>
  )
}
