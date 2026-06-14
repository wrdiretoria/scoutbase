'use client'

/**
 * RankingFiltros — filtros interativos do ranking (posição + cidade + estado).
 * As categorias ficam no Server Component como pills (sem JS).
 */

import { useRouter } from 'next/navigation'

const POSICOES = [
  'Goleiro', 'Lateral Direito', 'Lateral Esquerdo', 'Zagueiro',
  'Volante', 'Meia', 'Meia-Atacante', 'Ponta Direita', 'Ponta Esquerda',
  'Atacante', 'Centro-Avante',
]

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO',
  'MA','MT','MS','MG','PA','PB','PR','PE','PI',
  'RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

// sigla → nome completo (para lookup de cidades)
const ESTADO_NOME: Record<string, string> = {
  AC:'Acre',AL:'Alagoas',AP:'Amapá',AM:'Amazonas',BA:'Bahia',CE:'Ceará',
  DF:'Distrito Federal',ES:'Espírito Santo',GO:'Goiás',MA:'Maranhão',
  MT:'Mato Grosso',MS:'Mato Grosso do Sul',MG:'Minas Gerais',PA:'Pará',
  PB:'Paraíba',PR:'Paraná',PE:'Pernambuco',PI:'Piauí',
  RJ:'Rio de Janeiro',RN:'Rio Grande do Norte',RS:'Rio Grande do Sul',
  RO:'Rondônia',RR:'Roraima',SC:'Santa Catarina',SP:'São Paulo',
  SE:'Sergipe',TO:'Tocantins',
}

const CIDADES_BR: Record<string, string[]> = {
  'Acre': ['Rio Branco','Cruzeiro do Sul','Sena Madureira','Tarauacá','Feijó','Brasileia'],
  'Alagoas': ['Maceió','Arapiraca','Palmeira dos Índios','Rio Largo','Penedo','União dos Palmares','São Miguel dos Campos','Delmiro Gouveia'],
  'Amapá': ['Macapá','Santana','Laranjal do Jari','Oiapoque','Mazagão'],
  'Amazonas': ['Manaus','Parintins','Itacoatiara','Manacapuru','Coari','Tefé','Tabatinga','Maués'],
  'Bahia': ['Salvador','Feira de Santana','Vitória da Conquista','Camaçari','Juazeiro','Ilhéus','Itabuna','Lauro de Freitas','Barreiras','Jequié','Teixeira de Freitas','Alagoinhas','Porto Seguro','Paulo Afonso','Simões Filho','Eunápolis'],
  'Ceará': ['Fortaleza','Caucaia','Juazeiro do Norte','Maracanaú','Sobral','Crato','Itapipoca','Maranguape','Iguatu','Quixadá','Pacatuba','Russas','Aquiraz'],
  'Distrito Federal': ['Brasília','Ceilândia','Taguatinga','Samambaia','Planaltina','Águas Claras','Sobradinho','Recanto das Emas','Gama','Santa Maria','São Sebastião','Guará'],
  'Espírito Santo': ['Vitória','Serra','Vila Velha','Cariacica','Linhares','São Mateus','Cachoeiro de Itapemirim','Colatina','Guarapari','Aracruz'],
  'Goiás': ['Goiânia','Aparecida de Goiânia','Anápolis','Rio Verde','Luziânia','Águas Lindas de Goiás','Valparaíso de Goiás','Trindade','Formosa','Novo Gama','Itumbiara','Senador Canedo','Catalão','Jataí'],
  'Maranhão': ['São Luís','Imperatriz','São José de Ribamar','Timon','Caxias','Codó','Paço do Lumiar','Açailândia','Bacabal','Balsas'],
  'Mato Grosso': ['Cuiabá','Várzea Grande','Rondonópolis','Sinop','Tangará da Serra','Cáceres','Sorriso','Lucas do Rio Verde','Primavera do Leste','Barra do Garças'],
  'Mato Grosso do Sul': ['Campo Grande','Dourados','Três Lagoas','Corumbá','Grande Dourados','Ponta Porã','Naviraí','Nova Andradina','Aquidauana','Sidrolândia'],
  'Minas Gerais': ['Belo Horizonte','Uberlândia','Contagem','Juiz de Fora','Betim','Montes Claros','Ribeirão das Neves','Uberaba','Governador Valadares','Ipatinga','Sete Lagoas','Divinópolis','Santa Luzia','Ibirité','Poços de Caldas','Patos de Minas','Pouso Alegre','Barbacena','Sabará','Vespasiano'],
  'Pará': ['Belém','Ananindeua','Santarém','Marabá','Parauapebas','Castanhal','Abaetetuba','Cametá','Altamira','Itaituba','Tucuruí','Marituba'],
  'Paraíba': ['João Pessoa','Campina Grande','Santa Rita','Patos','Bayeux','Sousa','Cajazeiras','Cabedelo','Guarabira'],
  'Paraná': ['Curitiba','Londrina','Maringá','Ponta Grossa','Cascavel','São José dos Pinhais','Foz do Iguaçu','Colombo','Guarapuava','Paranaguá','Araucária','Toledo','Apucarana','Pinhais','Campo Largo','Almirante Tamandaré','Umuarama'],
  'Pernambuco': ['Recife','Caruaru','Olinda','Petrolina','Paulista','Jaboatão dos Guararapes','Boa Viagem','Garanhuns','Vitória de Santo Antão','Serra Talhada','Cabo de Santo Agostinho','Camaragibe','Abreu e Lima'],
  'Piauí': ['Teresina','Parnaíba','Picos','Piripiri','Floriano','Campo Maior'],
  'Rio de Janeiro': ['Rio de Janeiro','São Gonçalo','Duque de Caxias','Nova Iguaçu','Niterói','Belford Roxo','Campos dos Goytacazes','São João de Meriti','Macaé','Volta Redonda','Petrópolis','Magé','Itaboraí','Cabo Frio','Angra dos Reis','Mesquita','Nilópolis','Teresópolis','Queimados','Resende'],
  'Rio Grande do Norte': ['Natal','Mossoró','Parnamirim','São Gonçalo do Amarante','Macaíba','Ceará-Mirim','Caicó','Assu','Currais Novos'],
  'Rio Grande do Sul': ['Porto Alegre','Caxias do Sul','Pelotas','Canoas','Santa Maria','Gravataí','Viamão','Novo Hamburgo','São Leopoldo','Rio Grande','Alvorada','Passo Fundo','Sapucaia do Sul','Uruguaiana','Santa Cruz do Sul','Cachoeirinha','Bagé','Bento Gonçalves','Erechim','Guaíba'],
  'Rondônia': ['Porto Velho','Ji-Paraná','Ariquemes','Vilhena','Cacoal','Rolim de Moura','Jaru','Guajará-Mirim'],
  'Roraima': ['Boa Vista','Rorainópolis','Caracaraí'],
  'Santa Catarina': ['Florianópolis','Joinville','Blumenau','São José','Chapecó','Itajaí','Lages','Criciúma','Caçador','Jaraguá do Sul','Palhoça','Balneário Camboriú','Brusque','Tubarão','São Bento do Sul'],
  'São Paulo': ['São Paulo','Guarulhos','Campinas','São Bernardo do Campo','Santo André','Osasco','São José dos Campos','Ribeirão Preto','Sorocaba','Mauá','Santos','Mogi das Cruzes','Diadema','Jundiaí','Carapicuíba','Piracicaba','Barueri','Itaquaquecetuba','São Vicente','Franca','Guarujá','Taubaté','Praia Grande','Limeira','Suzano','Taboão da Serra','Sumaré','Bauru','Indaiatuba','Embu das Artes','São Carlos','Araraquara','Marília','Cotia','Americana'],
  'Sergipe': ['Aracaju','Nossa Senhora do Socorro','Lagarto','Itabaiana','São Cristóvão','Estância','Tobias Barreto'],
  'Tocantins': ['Palmas','Araguaína','Gurupi','Porto Nacional','Paraíso do Tocantins','Colinas do Tocantins'],
}

const CIDADES_INTL: Record<string, string[]> = {
  'Argentina': ['Buenos Aires','Córdoba','Rosario','Mendoza','La Plata','San Miguel de Tucumán','Mar del Plata','Salta','Santa Fe','San Juan'],
  'Paraguai': ['Assunção','Ciudad del Este','San Lorenzo','Luque','Capiatá','Lambaré','Fernando de la Mora','Limpio','Mariano Roque Alonso','Pedro Juan Caballero','Encarnación','Concepción'],
  'Uruguai': ['Montevidéu','Salto','Paysandú','Las Piedras','Rivera','Maldonado','Tacuarembó'],
  'Bolívia': ['Santa Cruz de la Sierra','La Paz','Cochabamba','Oruro','Sucre','Potosí','Tarija','Trinidad'],
  'Chile': ['Santiago','Antofagasta','Valparaíso','Concepción','La Serena','Arica','Talca','Temuco','Iquique','Rancagua'],
  'Colômbia': ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Cúcuta','Bucaramanga','Pereira','Santa Marta','Ibagué'],
  'Equador': ['Guayaquil','Quito','Cuenca','Manta','Portoviejo','Machala','Durán','Esmeraldas','Ambato'],
  'Peru': ['Lima','Arequipa','Trujillo','Chiclayo','Piura','Iquitos','Cusco','Huancayo','Tacna'],
  'Venezuela': ['Caracas','Maracaibo','Valencia','Barquisimeto','Maracay','Ciudad Guayana','San Cristóbal'],
  'Portugal': ['Lisboa','Porto','Amadora','Braga','Setúbal','Coimbra','Funchal','Almada','Aveiro','Guimarães'],
  'Espanha': ['Madrid','Barcelona','Valencia','Sevilha','Zaragoza','Málaga','Múrcia','Palma','Las Palmas','Bilbao'],
  'França': ['Paris','Marselha','Lyon','Toulouse','Nice','Nantes','Montpellier','Strasbourg','Bordeaux','Lille'],
  'Itália': ['Roma','Milão','Nápoles','Turim','Palermo','Génova','Bolonha','Florença','Veneza','Bari'],
  'Alemanha': ['Berlim','Hamburgo','Munique','Colônia','Frankfurt','Stuttgart','Düsseldorf','Dortmund','Essen','Leipzig'],
  'Inglaterra': ['Londres','Birmingham','Leeds','Glasgow','Sheffield','Bradford','Liverpool','Edinburgh','Manchester','Bristol'],
  'Estados Unidos': ['Nova York','Los Angeles','Chicago','Houston','Phoenix','Filadélfia','San Antonio','San Diego','Dallas','Miami','Atlanta','Orlando'],
  'México': ['Cidade do México','Guadalajara','Monterrey','Puebla','Tijuana','Toluca','León','Ciudad Juárez','Mérida','San Luis Potosí'],
}

const PAISES = [
  'Brasil','Argentina','Portugal','Uruguai','Paraguai','Chile','Colômbia',
  'Bolívia','Peru','Equador','Venezuela','Estados Unidos','Espanha','França',
  'Itália','Alemanha','Inglaterra','Japão','Coreia do Sul','Outro',
]

type Props = {
  categoriaFiltro?: string
  posicaoFiltro?:   string
  cidadeFiltro?:    string
  estadoFiltro?:    string
  paisFiltro?:      string
}

function buildUrl(p: { categoria?: string; posicao?: string; cidade?: string; estado?: string; pais?: string }) {
  const q = new URLSearchParams()
  if (p.categoria) q.set('categoria', p.categoria)
  if (p.posicao)   q.set('posicao',   p.posicao)
  if (p.pais)      q.set('pais',      p.pais)
  if (p.estado)    q.set('estado',    p.estado)
  if (p.cidade)    q.set('cidade',    p.cidade)
  const s = q.toString()
  return `/ranking${s ? `?${s}` : ''}`
}

export default function RankingFiltros({ categoriaFiltro, posicaoFiltro, cidadeFiltro, estadoFiltro, paisFiltro }: Props) {
  const router  = useRouter()

  const isBrasil = !paisFiltro || paisFiltro === 'Brasil'

  // Lista de cidades disponíveis conforme país/estado selecionado
  const cidadesDisponiveis: string[] = isBrasil
    ? (estadoFiltro ? CIDADES_BR[ESTADO_NOME[estadoFiltro] ?? ''] ?? [] : [])
    : (paisFiltro ? CIDADES_INTL[paisFiltro] ?? [] : [])

  function onPosicao(pos: string) {
    router.push(buildUrl({ categoria: categoriaFiltro, posicao: pos || undefined, cidade: cidadeFiltro, estado: estadoFiltro, pais: paisFiltro }))
  }

  function onPais(p: string) {
    router.push(buildUrl({ categoria: categoriaFiltro, posicao: posicaoFiltro, pais: p || undefined }))
  }

  function onEstado(uf: string) {
    router.push(buildUrl({ categoria: categoriaFiltro, posicao: posicaoFiltro, estado: uf || undefined, pais: paisFiltro }))
  }

  function onCidade(c: string) {
    router.push(buildUrl({ categoria: categoriaFiltro, posicao: posicaoFiltro, cidade: c || undefined, estado: estadoFiltro, pais: paisFiltro }))
  }

  const temFiltro = posicaoFiltro || cidadeFiltro || estadoFiltro || paisFiltro

  const selectBase: React.CSSProperties = {
    padding: '9px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', outline: 'none', cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
  }

  return (
    <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Posição */}
        <select
          value={posicaoFiltro ?? ''}
          onChange={e => onPosicao(e.target.value)}
          style={{ ...selectBase, flex: '1', minWidth: '140px' }}
        >
          <option value="">Todas as posições</option>
          {POSICOES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* País */}
        <select
          value={paisFiltro ?? ''}
          onChange={e => onPais(e.target.value)}
          style={{ ...selectBase, minWidth: '120px' }}
        >
          <option value="">Todos os países</option>
          {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Estado — só aparece se país for Brasil */}
        {isBrasil && (
          <select
            value={estadoFiltro ?? ''}
            onChange={e => onEstado(e.target.value)}
            style={{ ...selectBase, minWidth: '90px' }}
          >
            <option value="">Todos os estados</option>
            {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        )}

        {/* Cidade — select quando há lista disponível */}
        {cidadesDisponiveis.length > 0 && (
          <select
            value={cidadeFiltro ?? ''}
            onChange={e => onCidade(e.target.value)}
            style={{ ...selectBase, flex: '1', minWidth: '140px' }}
          >
            <option value="">Todas as cidades</option>
            {cidadesDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Limpar filtros extras */}
        {temFiltro && (
          <a
            href={buildUrl({ categoria: categoriaFiltro })}
            style={{
              padding: '9px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700,
              color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', textDecoration: 'none', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            ✕ Limpar
          </a>
        )}
      </div>

      {/* Tags dos filtros ativos */}
      {temFiltro && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {paisFiltro && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#fbbf24',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              🌍 {paisFiltro}
            </span>
          )}
          {posicaoFiltro && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#22c55e',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              {posicaoFiltro}
            </span>
          )}
          {estadoFiltro && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#a78bfa',
              background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              🗺️ {estadoFiltro}
            </span>
          )}
          {cidadeFiltro && (
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#60a5fa',
              background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: '20px', padding: '3px 10px',
            }}>
              📍 {cidadeFiltro}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
