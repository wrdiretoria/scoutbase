/**
 * /atleta/[sid] — Perfil público de atleta Meu Craque
 * Acessa pelo ID numérico (ex: MC-82751 → /atleta/82751)
 * Sem login necessário.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrSingle } from '@/lib/ovr'
import { SERVER_BASE_URL } from '@/lib/base-url'
import PhotoCycler from '@/app/components/PhotoCycler'
import ShareButton from '@/app/components/ShareButton'

type Props = { params: Promise<{ sid: string }> }

// ── Questionário — label maps (espelham atleta/questionario/page.tsx) ──────────

const ESTILO_LABEL: Record<string, string> = {
  finalizador: '🎯 Finalizador',
  construtor:  '🎨 Construtor',
  batalhador:  '⚔️ Batalhador',
  equilibrado: '⚖️ Equilibrado',
}

const CARACTERISTICA_LABEL: Record<string, string> = {
  velocidade: '⚡ Velocidade',
  tecnica:    '🎯 Técnica',
  forca:      '💪 Força física',
  visao:      '👁 Visão de jogo',
  lideranca:  '🦁 Liderança',
  garra:      '🔥 Garra',
}

const PE_LABEL: Record<string, string> = {
  direito:    'Pé Direito',
  esquerdo:   'Pé Esquerdo',
  ambidestro: 'Ambidestro',
}

const NIVEL_LABEL: Record<string, string> = {
  escolinha:    'Escolinha',
  amador:       'Amador',
  municipal:    'Municipal',
  estadual:     'Estadual',
  nacional:     'Nacional',
  profissional: 'Profissional',
}

const CLUBE_PROF_LABEL: Record<string, string> = {
  sim_atual:   'Sim, atualmente',
  sim_passado: 'Já esteve em clube pro',
  nunca_quero: 'Ainda não, mas quer',
  nao:         'Nunca teve / sem objetivo',
}

const ANOS_LABEL: Record<string, string> = {
  menos1: 'Menos de 1 ano',
  '1a3':  '1 a 3 anos',
  '3a5':  '3 a 5 anos',
  mais5:  'Mais de 5 anos',
}

const FREQ_LABEL: Record<string, string> = {
  '1a2':   '1 a 2 vezes/semana',
  '3a4':   '3 a 4 vezes/semana',
  '5mais': '5 ou mais vezes/semana',
  nenhuma: 'Não está treinando',
}

const DISP_LABEL: Record<string, string> = {
  qualquer: 'Sim, qualquer lugar',
  estado:   'Sim, no mesmo estado',
  nao:      'Não por agora',
}

const OBJ_LABEL: Record<string, string> = {
  clube_pro:    'Entrar em clube profissional',
  estadual:     'Disputar campeonato estadual',
  profissional: 'Ser jogador profissional',
  exterior:     'Jogar no exterior',
}

const SUPORTE_LABEL: Record<string, string> = {
  familia:    '👨‍👩‍👦 Família',
  empresario: '🤝 Empresário / Agente',
  treinador:  '👨‍🏫 Treinador particular',
  ninguem:    '🙋 Caminhando sozinho',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function calcularIdade(dataNasc: string): number {
  const hoje = new Date(), nasc = new Date(dataNasc)
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

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function ovrColor(ovr: number) {
  if (ovr >= 80) return '#00FF88'
  if (ovr >= 65) return '#fbbf24'
  return '#f97316'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AttrBar({ label, val }: { label: string; val: number }) {
  const pct   = Math.round((val / 10) * 100)
  const color = val >= 8 ? '#00FF88' : val >= 6 ? '#fbbf24' : '#f97316'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', width: '130px', flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px' }} />
      </div>
      <span style={{ fontSize: '12px', fontWeight: 800, color, width: '28px', textAlign: 'right' }}>
        {val.toFixed(1)}
      </span>
    </div>
  )
}

function FichaRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '15px', width: '22px', textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', width: '112px', flexShrink: 0, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>{children}</span>
    </div>
  )
}

function Chip({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: '12px', fontWeight: 700,
      padding: '5px 12px', borderRadius: '20px',
      background: highlight ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
      color: highlight ? '#4ade80' : 'rgba(255,255,255,0.55)',
      border: highlight ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.07)',
    }}>
      {children}
    </span>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: '16px', padding: '18px 20px',
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.02)',
      marginBottom: '14px',
    }}>
      <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sid } = await params
  const athleteId = `MC-${sid.toUpperCase()}`
  try {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('athlete_id', athleteId)
      .maybeSingle()
    if (!profile) return { title: 'Atleta — Meu Craque' }
    const { data: { user } } = await admin.auth.admin.getUserById(profile.id)
    const nome = (user?.user_metadata?.nome as string | undefined) ?? 'Atleta'
    return {
      title: `${nome} — Meu Craque`,
      description: `Veja o perfil de ${nome} no Meu Craque: OVR, atributos e currículo.`,
      openGraph: { title: `${nome} — Meu Craque`, url: `${SERVER_BASE_URL}/atleta/${sid}` },
    }
  } catch { return { title: 'Atleta — Meu Craque' } }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AtletaPage({ params }: Props) {
  const { sid } = await params
  const athleteId = `MC-${sid.toUpperCase()}`
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id, athlete_id, avatar_url, fotos, data_nascimento, bio, altura, peso, pe_dominante, clube_atual')
    .eq('athlete_id', athleteId)
    .maybeSingle()

  // ── Atleta não encontrado ─────────────────────────────────────────────────
  if (!profile) {
    return (
      <main style={{
        background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif',
        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>⚽</div>
          <h1 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900 }}>
            Atleta não encontrado
          </h1>
          <p style={{ margin: '0 0 32px', color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Nenhum atleta com ID{' '}
            <strong style={{ color: '#22c55e' }}>{athleteId}</strong>{' '}
            está cadastrado na plataforma.
          </p>
          <Link
            href="/ranking"
            style={{
              display: 'inline-block', padding: '12px 28px',
              borderRadius: '12px', background: '#22c55e',
              color: '#000', fontWeight: 800, fontSize: '14px', textDecoration: 'none',
            }}
          >
            ← Voltar ao ranking
          </Link>
        </div>
      </main>
    )
  }

  // ── Dados do atleta ───────────────────────────────────────────────────────
  const { data: { user } } = await admin.auth.admin.getUserById(profile.id as string)
  const meta = user?.user_metadata as {
    nome?: string
    posicao?: string
    cidade?: string
    estado?: string
    campeonatos?: string
    clubes_anteriores?: string
    premiacoes?: string
    titulos?: string
    questionario?: Record<string, string>
    questionario_completo?: boolean
  } | undefined

  const nome     = meta?.nome    ?? 'Atleta'
  const posicao  = meta?.posicao ?? ''
  const cidade   = meta?.cidade  ?? ''
  const estado   = meta?.estado  ?? ''
  const dataNasc = (profile.data_nascimento as string | null) ?? null
  const bio      = (profile.bio as string | null) ?? null
  const avatarUrl = (profile.avatar_url as string | null) ?? null

  // Dados físicos — profiles tem prioridade, questionário como fallback
  const alturaDB    = (profile.altura       as number | null) ?? null
  const pesoDb      = (profile.peso         as number | null) ?? null
  const peDomDB     = (profile.pe_dominante as string | null) ?? null
  const clubeDB     = (profile.clube_atual  as string | null) ?? null

  // Questionário
  const q = meta?.questionario ?? {}
  const peDominante = peDomDB ?? (q.pe_dominante ? PE_LABEL[q.pe_dominante] ?? q.pe_dominante : null)

  const [ovr, avRes] = await Promise.all([
    fetchOvrSingle(admin, athleteId),
    admin
      .from('avaliacoes')
      .select('velocidade, visao_jogo, forca, finalizacao, posicionamento, tecnica, scout_score, created_at')
      .eq('aluno_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const ultimaAv  = avRes.data
  const categoria = dataNasc ? calcularCategoria(dataNasc) : null
  const idade     = dataNasc ? calcularIdade(dataNasc) : null
  const initials  = getInitials(nome)
  const cor       = ovr ? ovrColor(ovr) : 'rgba(255,255,255,0.2)'

  // Fotos
  const fotosArr: (string | null)[] = (profile.fotos as (string | null)[] | null) ?? []
  const galeriaFotos = fotosArr.filter((f): f is string => !!f)
  const displayFotos: string[] = galeriaFotos.length > 0
    ? galeriaFotos
    : (avatarUrl ? [avatarUrl] : [])

  // Localização
  const localizacao = [cidade, estado].filter(Boolean).join(' – ')

  // Currículo extras
  const campeonatos      = meta?.campeonatos?.trim()      || null
  const clubesAnteriores = meta?.clubes_anteriores?.trim() || null
  const premiacoes       = meta?.premiacoes?.trim()       || null
  const titulos          = meta?.titulos?.trim()          || null
  const temCurriculo     = !!(campeonatos || clubesAnteriores || premiacoes || titulos)

  // Ficha — tem dados físicos?
  const temFicha = !!(dataNasc || alturaDB || pesoDb || peDominante || clubeDB || localizacao)

  // Questionário — tem dados?
  const temQ = Object.keys(q).length > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main style={{ background: '#06100a', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px 56px' }}>

        {/* Nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <Link href="/ranking" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            ← Ranking
          </Link>
          <Link href="/" style={{ textDecoration: 'none', fontSize: '11px', fontWeight: 800, color: '#22c55e', letterSpacing: '0.06em' }}>
            ⚽ meucraque.com
          </Link>
        </div>

        {/* ── Card principal ── */}
        <div style={{
          borderRadius: '20px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.025)',
          marginBottom: '14px',
        }}>
          {/* Foto */}
          <div style={{ position: 'relative', height: '220px', background: 'linear-gradient(135deg,#0d1f14,#1a4a2a)', overflow: 'hidden' }}>
            <PhotoCycler fotos={displayFotos} nome={nome} initials={initials} ovrColor={cor} />

            {/* OVR badge */}
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
              borderRadius: '12px', padding: '8px 14px', textAlign: 'center',
              border: `1px solid ${cor}44`,
            }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>OVR</div>
              <div style={{ fontSize: '30px', fontWeight: 900, color: cor, lineHeight: 1 }}>{ovr ?? '—'}</div>
            </div>

            {/* Categoria badge */}
            {categoria && (
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                fontSize: '10px', fontWeight: 700, color: '#4ade80',
                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: '8px', padding: '4px 10px', backdropFilter: 'blur(8px)',
              }}>
                {categoria}
              </div>
            )}
          </div>

          <div style={{ padding: '20px' }}>
            <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>
              {nome}
            </h1>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'rgba(255,255,255,0.42)' }}>
              {[posicao && `${posAbrev(posicao)} — ${posicao}`, localizacao, idade ? `${idade} anos` : null]
                .filter(Boolean).join(' · ')}
            </p>

            {/* Tags de destaque do questionário */}
            {(q.estilo || q.caracteristica) && (
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px' }}>
                {q.estilo       && <Chip highlight>{ESTILO_LABEL[q.estilo]       ?? q.estilo}</Chip>}
                {q.caracteristica && <Chip highlight>{CARACTERISTICA_LABEL[q.caracteristica] ?? q.caracteristica}</Chip>}
              </div>
            )}

            {/* Dados físicos rápidos */}
            {(alturaDB || pesoDb || peDominante) && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {alturaDB   && <Tag>{alturaDB}cm</Tag>}
                {pesoDb     && <Tag>{pesoDb}kg</Tag>}
                {peDominante && <Tag>{peDominante}</Tag>}
              </div>
            )}

            {clubeDB && (
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>
                ⚽ {clubeDB}
              </p>
            )}

            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.18)', fontWeight: 700, letterSpacing: '0.1em' }}>
              {athleteId}
            </div>
          </div>
        </div>

        {/* ── Compartilhar ── */}
        <div style={{ marginBottom: '14px' }}>
          <ShareButton />
        </div>

        {/* ── Galeria de fotos ── */}
        {galeriaFotos.length > 1 && (
          <SectionCard title="Galeria de fotos">
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
              {galeriaFotos.map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={f} alt=""
                  style={{
                    width: '80px', height: '80px', objectFit: 'cover',
                    objectPosition: 'top center', borderRadius: '10px', flexShrink: 0,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Ficha do atleta ── */}
        <SectionCard title="Ficha do atleta">
          {temFicha ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dataNasc && (() => {
                const [ano, mes, dia] = dataNasc.split('-')
                return (
                  <FichaRow icon="🎂" label="Nascimento">
                    {`${dia}/${mes}/${ano}`}
                    {idade != null && (
                      <span style={{ color: 'rgba(255,255,255,0.32)', fontSize: '11px' }}> · {idade} anos</span>
                    )}
                  </FichaRow>
                )
              })()}
              {localizacao && <FichaRow icon="📍" label="Cidade">{localizacao}</FichaRow>}
              {posicao     && <FichaRow icon="🏃" label="Posição">{posicao}</FichaRow>}
              {alturaDB    && <FichaRow icon="📏" label="Altura">{alturaDB} cm</FichaRow>}
              {pesoDb      && <FichaRow icon="⚖️" label="Peso">{pesoDb} kg</FichaRow>}
              {peDominante && <FichaRow icon="👟" label="Pé dominante">{peDominante}</FichaRow>}
              {clubeDB     && <FichaRow icon="⚽" label="Clube atual">{clubeDB}</FichaRow>}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
              Dados ainda não preenchidos neste perfil.
            </p>
          )}
        </SectionCard>

        {/* ── Características & Estilo ── */}
        {temQ && (
          <SectionCard title="Características">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {q.estilo && (
                <FichaRow icon="🎭" label="Estilo em campo">
                  {ESTILO_LABEL[q.estilo] ?? q.estilo}
                </FichaRow>
              )}
              {q.caracteristica && (
                <FichaRow icon="⭐" label="Ponto forte">
                  {CARACTERISTICA_LABEL[q.caracteristica] ?? q.caracteristica}
                </FichaRow>
              )}
              {q.pe_dominante && !peDomDB && (
                <FichaRow icon="👟" label="Pé dominante">
                  {PE_LABEL[q.pe_dominante] ?? q.pe_dominante}
                </FichaRow>
              )}
              {q.disponibilidade && (
                <FichaRow icon="🚀" label="Disponibilidade">
                  {DISP_LABEL[q.disponibilidade] ?? q.disponibilidade}
                </FichaRow>
              )}
              {q.suporte && (
                <FichaRow icon="🤝" label="Suporte">
                  {SUPORTE_LABEL[q.suporte] ?? q.suporte}
                </FichaRow>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── Carreira & Trajetória ── */}
        {temQ && (
          <SectionCard title="Carreira">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {q.anos_treinando && (
                <FichaRow icon="📅" label="Treinando há">
                  {ANOS_LABEL[q.anos_treinando] ?? q.anos_treinando}
                </FichaRow>
              )}
              {q.frequencia && (
                <FichaRow icon="🏋️" label="Frequência">
                  {FREQ_LABEL[q.frequencia] ?? q.frequencia}
                </FichaRow>
              )}
              {q.nivel_competicao && (
                <FichaRow icon="🏆" label="Nível mais alto">
                  {NIVEL_LABEL[q.nivel_competicao] ?? q.nivel_competicao}
                </FichaRow>
              )}
              {q.clube_profissional && (
                <FichaRow icon="🏟️" label="Clube profissional">
                  {CLUBE_PROF_LABEL[q.clube_profissional] ?? q.clube_profissional}
                </FichaRow>
              )}
              {q.objetivo && (
                <FichaRow icon="🎯" label="Objetivo">
                  {OBJ_LABEL[q.objetivo] ?? q.objetivo}
                </FichaRow>
              )}

              {/* Extras preenchidos pelo atleta no perfil */}
              {clubesAnteriores && (
                <FichaRow icon="🏛️" label="Clubes anteriores">{clubesAnteriores}</FichaRow>
              )}
              {campeonatos && (
                <FichaRow icon="🏅" label="Campeonatos">{campeonatos}</FichaRow>
              )}
              {premiacoes && (
                <FichaRow icon="🥇" label="Premiações">{premiacoes}</FichaRow>
              )}
              {titulos && (
                <FichaRow icon="🏆" label="Títulos">{titulos}</FichaRow>
              )}
            </div>
          </SectionCard>
        )}

        {/* Currículo sem questionário mas com dados extras */}
        {!temQ && temCurriculo && (
          <SectionCard title="Currículo">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {clubesAnteriores && <FichaRow icon="🏛️" label="Clubes anteriores">{clubesAnteriores}</FichaRow>}
              {campeonatos      && <FichaRow icon="🏅" label="Campeonatos">{campeonatos}</FichaRow>}
              {premiacoes       && <FichaRow icon="🥇" label="Premiações">{premiacoes}</FichaRow>}
              {titulos          && <FichaRow icon="🏆" label="Títulos">{titulos}</FichaRow>}
            </div>
          </SectionCard>
        )}

        {/* ── Atributos técnicos (só se avaliado por treinador) ── */}
        {ultimaAv && (
          <SectionCard title="Atributos técnicos">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AttrBar label="Velocidade"    val={ultimaAv.velocidade} />
              <AttrBar label="Visão de jogo" val={ultimaAv.visao_jogo} />
              <AttrBar label="Força"          val={ultimaAv.forca} />
              <AttrBar label="Finalização"    val={ultimaAv.finalizacao} />
              <AttrBar label="Posicionamento" val={ultimaAv.posicionamento} />
              <AttrBar label="Técnica"        val={ultimaAv.tecnica} />
            </div>
            <p style={{ margin: '12px 0 0', fontSize: '10px', color: 'rgba(255,255,255,0.2)', textAlign: 'right' }}>
              Avaliado por treinador · OVR {ultimaAv.scout_score}
            </p>
          </SectionCard>
        )}

        {/* ── Sobre o atleta ── */}
        <SectionCard title="Sobre o atleta">
          {bio ? (
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, fontStyle: 'italic' }}>
              &ldquo;{bio}&rdquo;
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>
              Bio não preenchida ainda.
            </p>
          )}
        </SectionCard>

        {/* Rodapé */}
        <div style={{ textAlign: 'center', paddingTop: '8px' }}>
          <Link href="/ranking" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
            ← Voltar ao ranking
          </Link>
        </div>

      </div>
    </main>
  )
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '12px', color: 'rgba(255,255,255,0.35)',
      background: 'rgba(255,255,255,0.06)', borderRadius: '6px', padding: '3px 9px',
    }}>
      {children}
    </span>
  )
}
