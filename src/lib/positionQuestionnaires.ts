import type { BlocoOvr } from './blocosOvr'

const criteria = {
  goleiro: {
    name: 'Goleiro',
    tecnico: [
      'segura chutes rasteiros sem dar rebote',
      'encaixa bolas na altura do peito',
      'amortece finalizações fortes para um lado seguro',
      'repõe a bola com as mãos no pé de um companheiro',
      'encontra um passe rasteiro para iniciar a saída',
      'ataca a bola alta no ponto certo',
      'protege o gol em finalizações à queima-roupa',
    ],
    tatico: [
      'ajusta a posição conforme o ângulo do chute',
      'decide quando sair do gol para interceptar um passe',
      'escolhe entre encaixar e espalmar um cruzamento',
      'oferece linha de passe quando a defesa recua a bola',
      'identifica quando acelerar a reposição após uma defesa',
    ],
    fisico: [
      'reage a um chute desviado',
      'desloca-se de um poste ao outro antes da finalização',
      'impulsiona-se para alcançar bolas altas',
      'recupera a base após uma defesa baixa',
      'mantém a qualidade dos movimentos em defesas seguidas',
    ],
    comportamento: [
      'orienta a defesa sobre adversários livres',
      'reorganiza-se depois de sofrer um gol',
      'avisa com clareza quando vai atacar uma bola aérea',
    ],
  },
  lateral_direito: {
    name: 'Lateral Direito',
    tecnico: [
      'recebe junto à linha direita com o corpo voltado para o campo',
      'cruza da direita para a zona do primeiro pau',
      'executa passe rasteiro para trás ao chegar à linha de fundo direita',
      'desarma o ponta adversário sem cometer falta',
      'encontra o meia por dentro com passe diagonal da direita',
      'conduz pelo corredor direito mantendo a bola disponível para o passe',
      'domina a inversão de jogo no lado direito',
    ],
    tatico: [
      'reconhece quando ultrapassar o ponta direito',
      'protege o espaço às costas do zagueiro pela direita',
      'fecha o segundo pau direito quando o cruzamento sai da esquerda',
      'escolhe quando apoiar por dentro para liberar a faixa direita',
      'identifica quando pressionar o adversário junto à linha direita',
    ],
    fisico: [
      'acelera para cobrir uma bola lançada nas suas costas pela direita',
      'muda de direção para acompanhar um corte do ponta para dentro',
      'repete subidas pelo lado direito com retorno defensivo',
      'estabiliza o corpo em duelos junto à linha direita',
      'freia a corrida antes de enfrentar o driblador do seu lado',
    ],
    comportamento: [
      'combina com o ponta direito quem ocupa a faixa externa',
      'avisa o zagueiro quando um adversário entra pela sua direita',
      'retoma a marcação no corredor direito depois de perder um duelo',
    ],
  },
  lateral_esquerdo: {
    name: 'Lateral Esquerdo',
    tecnico: [
      'domina a bola junto à linha esquerda deixando-a pronta para avançar',
      'cruza da esquerda entre o goleiro e a última linha',
      'acha um passe curto por dentro ao receber pressionado na esquerda',
      'bloqueia o cruzamento do adversário pelo lado esquerdo',
      'faz o passe na passada do ponta esquerdo',
      'carrega a bola pelo corredor esquerdo protegendo-a do marcador',
      'devolve de primeira na tabela pelo lado esquerdo',
    ],
    tatico: [
      'decide entre ultrapassar por fora e infiltrar por dentro na esquerda',
      'fecha o segundo pau esquerdo quando a bola vem da direita',
      'entrega a marcação ao zagueiro quando o atacante corta da esquerda para o centro',
      'temporiza quando o lado esquerdo fica em inferioridade',
      'reconhece quando abrir na esquerda para receber a virada',
    ],
    fisico: [
      'arranca para acompanhar uma infiltração no corredor esquerdo',
      'gira o corpo para reagir a um passe nas suas costas pela esquerda',
      'repete transições de ida e volta no lado esquerdo',
      'sustenta o equilíbrio no contato ao fechar a linha de fundo esquerda',
      'desloca-se lateralmente para proteger a entrada por dentro na esquerda',
    ],
    comportamento: [
      'coordena com o ponta esquerdo a cobertura da subida',
      'chama a dobra de marcação quando o adversário progride pela esquerda',
      'reocupa seu setor esquerdo depois de errar um passe no apoio',
    ],
  },
  zagueiro: {
    name: 'Zagueiro',
    tecnico: [
      'intercepta passes rasteiros à frente da área',
      'direciona o cabeceio defensivo para uma zona segura',
      'desarma sem deixar a bola à disposição de outro atacante',
      'recebe de perfil para sair jogando',
      'quebra a primeira linha com passe rasteiro',
      'afasta cruzamentos baixos antes da finalização',
      'executa uma inversão de jogo para o lateral livre',
    ],
    tatico: [
      'mantém a linha alinhada com o outro zagueiro',
      'decide quando antecipar o atacante que recebe de costas',
      'cobre o espaço deixado pelo companheiro que sai no bote',
      'protege a profundidade quando o passador está livre',
      'identifica a prioridade de marcação dentro da área',
    ],
    fisico: [
      'acelera para recuperar a profundidade após um lançamento',
      'vira o quadril para acompanhar uma ruptura',
      'ganha altura no duelo aéreo',
      'sustenta a posição no contato com o atacante',
      'repete ações de cobertura sem perder a base defensiva',
    ],
    comportamento: [
      'comanda a subida da linha após o corte',
      'orienta a troca de marcação entre zagueiros',
      'mantém a organização da área depois de falhar em um corte',
    ],
  },
  volante: {
    name: 'Volante',
    tecnico: [
      'recebe de perfil à frente dos zagueiros',
      'intercepta o passe destinado ao meia adversário',
      'executa passe vertical entre linhas',
      'gira para escapar da pressão na primeira recepção',
      'inverte o jogo para o corredor livre',
      'protege a bola de costas no setor central',
      'recupera a bola com desarme controlado',
    ],
    tatico: [
      'cobre o espaço quando o lateral sobe',
      'fecha a linha de passe para o centroavante',
      'escolhe quando baixar entre os zagueiros na saída',
      'reconhece quando acelerar o jogo após recuperar a bola',
      'protege a entrada da área na transição defensiva',
    ],
    fisico: [
      'reage à segunda bola no meio-campo',
      'acelera para encurtar o espaço do meia adversário',
      'aguenta contato ao disputar a bola no centro',
      'repete deslocamentos entre os corredores sem perder intensidade',
      'muda de direção para ajustar a cobertura',
    ],
    comportamento: [
      'avisa quem recebe de costas sobre a pressão',
      'organiza a cobertura quando outro meio-campista sai',
      'reage à perda da bola priorizando o equilíbrio do meio',
    ],
  },
  meia: {
    name: 'Meia',
    tecnico: [
      'recebe orientado no meio para jogar para a frente',
      'executa passe entre adversários para o atacante',
      'alterna o jogo com passe para o lado livre',
      'gira com a bola quando recebe entre linhas',
      'conduz para atrair a marcação e liberar um companheiro',
      'executa tabela curta para sair da pressão central',
      'ajusta a força do passe ao ritmo da jogada',
    ],
    tatico: [
      'busca uma linha de passe atrás do primeiro marcador',
      'reconhece quando controlar o ritmo da posse',
      'ocupa um espaço diferente do outro meia',
      'oferece apoio após dar um passe vertical',
      'decide quando trocar o corredor de ataque',
    ],
    fisico: [
      'acelera para abrir uma linha de passe após a recuperação',
      'muda de direção para se desvencilhar da marcação',
      'mantém a coordenação ao girar com a bola',
      'repete apoios em diferentes alturas do meio-campo',
      'equilibra-se ao receber sob contato',
    ],
    comportamento: [
      'orienta quem tem a bola sobre a opção livre no meio',
      'continua oferecendo apoio depois de errar um passe',
      'ajusta o posicionamento quando um companheiro pede espaço',
    ],
  },
  meia_atacante: {
    name: 'Meia-Atacante',
    tecnico: [
      'domina entre linhas deixando a bola pronta para o último passe',
      'executa passe em profundidade no tempo da infiltração',
      'finaliza de média distância após receber de frente',
      'elimina o marcador com giro curto entre linhas',
      'conduz pelo espaço entre lateral e zagueiro',
      'faz tabela curta na entrada da área',
      'serve um companheiro na área com passe de primeira',
    ],
    tatico: [
      'encontra espaço às costas dos volantes adversários',
      'escolhe entre servir o atacante e finalizar na entrada da área',
      'ataca a área quando o centroavante sai para apoiar',
      'identifica quando aproximar-se da ponta para criar superioridade',
      'fecha o primeiro passe por dentro após perder a bola',
    ],
    fisico: [
      'arranca no espaço entre as linhas após a recuperação',
      'reage a rebotes na entrada da área',
      'muda de direção ao receber com um marcador nas costas',
      'mantém equilíbrio na finalização após contato',
      'repete movimentos de aproximação e infiltração',
    ],
    comportamento: [
      'indica ao atacante quando vai passar em profundidade',
      'coordena com o centroavante quem ataca a área',
      'volta a oferecer opção entre linhas após perder uma jogada',
    ],
  },
  ponta_direita: {
    name: 'Ponta Direita',
    tecnico: [
      'domina aberto à direita preparando o duelo com o lateral',
      'cruza da direita após vencer pela linha de fundo',
      'finaliza após cortar da direita em direção ao centro',
      'dribla por fora no um contra um pela direita',
      'conduz em diagonal da direita para atrair o zagueiro',
      'executa passe para trás da defesa saindo do lado direito',
      'recebe a inversão na direita e dá sequência de primeira',
    ],
    tatico: [
      'reconhece quando manter a amplitude à direita',
      'ataca as costas do lateral adversário pela direita',
      'fecha o lado direito na pressão à saída adversária',
      'abre espaço por dentro quando o lateral direito ultrapassa',
      'ataca o segundo pau direito nos cruzamentos da esquerda',
    ],
    fisico: [
      'arranca da direita no momento do passe em profundidade',
      'freia para mudar de direção diante do lateral',
      'repete sprints pelo corredor direito',
      'mantém equilíbrio ao cruzar depois de contato pela direita',
      'recupera distância para ajudar o lateral direito após a perda',
    ],
    comportamento: [
      'combina a troca de corredor com o lateral direito',
      'avisa quando pretende atacar as costas do lateral adversário',
      'recompõe pelo lado direito depois de perder o duelo',
    ],
  },
  ponta_esquerda: {
    name: 'Ponta Esquerda',
    tecnico: [
      'domina aberto à esquerda protegendo a bola da pressão',
      'serve o atacante com cruzamento rasteiro da esquerda',
      'finaliza após conduzir da esquerda para a entrada da área',
      'dribla por dentro partindo do lado esquerdo',
      'conduz pela linha esquerda sem perder a vantagem do primeiro toque',
      'tabela com o lateral esquerdo para sair da dobra',
      'acha o passe diagonal para quem infiltra pelo lado oposto',
    ],
    tatico: [
      'decide quando abrir na esquerda para receber a inversão',
      'ataca o intervalo entre lateral e zagueiro a partir da esquerda',
      'acompanha o lateral adversário quando ele sobe pela sua faixa',
      'arrasta a marcação para liberar o corredor esquerdo ao companheiro',
      'ataca o segundo pau esquerdo quando a jogada vem da direita',
    ],
    fisico: [
      'acelera para chegar primeiro a um passe lançado na esquerda',
      'muda o ritmo ao encarar o marcador junto à linha esquerda',
      'repete arrancadas por fora e por dentro a partir da esquerda',
      'sustenta o equilíbrio ao proteger a bola no corredor esquerdo',
      'retorna em velocidade para recompor seu lado',
    ],
    comportamento: [
      'indica ao meia onde quer receber partindo da esquerda',
      'avisa o lateral esquerdo quando troca a faixa externa pela interna',
      'retoma a pressão no lado esquerdo após um cruzamento bloqueado',
    ],
  },
  atacante: {
    name: 'Atacante',
    tecnico: [
      'finaliza após receber em movimento fora da área',
      'domina o passe longo orientando para a meta',
      'toca para o companheiro que infiltra após seu apoio',
      'vence o defensor em condução rumo ao gol',
      'protege a bola para o time chegar ao ataque',
      'finaliza após driblar o último marcador',
      'executa passe lateral para criar uma finalização melhor',
    ],
    tatico: [
      'ataca o espaço entre zagueiro e lateral sem entrar em impedimento',
      'decide quando sair da área para receber e girar',
      'alterna aproximação e ruptura conforme a posição do passador',
      'fecha a linha de passe ao volante na primeira pressão',
      'ocupa o espaço livre quando outro atacante arrasta a defesa',
    ],
    fisico: [
      'arranca para vencer o zagueiro em corrida diagonal',
      'reage à sobra de um desarme no ataque',
      'muda de ritmo antes de atacar a última linha',
      'sustenta o contato durante uma condução ao gol',
      'repete esforços de pressão e desmarque',
    ],
    comportamento: [
      'combina movimentos com o outro atacante',
      'reage ao erro de finalização buscando a próxima ação útil',
      'coordena o início da pressão com os pontas',
    ],
  },
  centro_avante: {
    name: 'Centro-Avante',
    tecnico: [
      'finaliza de primeira dentro da área',
      'direciona o cabeceio ao gol',
      'amortece passes de costas para a meta',
      'gira sobre o zagueiro após dominar na área',
      'protege a bola até chegar o apoio',
      'desvia cruzamento rasteiro no primeiro pau',
      'finaliza sob contato dentro da pequena área',
    ],
    tatico: [
      'separa-se do zagueiro antes de atacar o cruzamento',
      'escolhe entre atacar primeiro pau e segundo pau',
      'prende os zagueiros para abrir espaço ao meia-atacante',
      'reconhece a posição do goleiro antes de finalizar',
      'antecipa a zona provável do rebote dentro da área',
    ],
    fisico: [
      'arranca em poucos metros para antecipar o zagueiro',
      'reage a uma sobra na pequena área',
      'ganha impulsão para cabecear sob marcação',
      'mantém a base ao disputar posição de costas',
      'repete movimentos curtos de desmarque na área',
    ],
    comportamento: [
      'indica ao ponta a zona onde espera o cruzamento',
      'permanece disponível após perder um duelo de costas',
      'coordena com o meia quem ataca a sobra do primeiro lance',
    ],
  },
} as const

const phases = {
  iniciacao: ['Iniciação', 'Em exercícios simples com tempo para executar', 'Em jogos reduzidos com espaço para decidir', 'Em ações curtas no ritmo da categoria', 'Com a orientação do treinador'],
  formacao: ['Formação', 'Em jogos da categoria com oposição direta', 'Em jogos da categoria considerando companheiros e adversários', 'Em sequências de duas ou três ações durante o jogo', 'Em jogos da categoria com pouca orientação externa'],
  competicao: ['Competição', 'Sob pressão com pouco tempo ou espaço', 'Quando a jogada muda rapidamente em competição', 'Em esforços repetidos de alta intensidade para a categoria', 'Em jogos competitivos inclusive após erros'],
  sub20: ['Sub-20', 'Sob pressão coordenada em ritmo alto de jogo', 'Diante de mudanças na organização adversária em ritmo alto', 'Em esforços intensos inclusive na parte final do jogo', 'Em jogos decisivos mantendo autonomia até o fim'],
} as const

type Phase = keyof typeof phases
type Position = keyof typeof criteria
export type PositionQuestionnaireKey = `v2_${Phase}_${Position}`
export type CardAttribute = 'VEL' | 'TEC' | 'DRI' | 'FIS' | 'TAT' | 'POS'

function normalize(position: string) {
  return position.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z]/g, '')
}

export function positionQuestionnaireKey(phase: Phase, position: string): PositionQuestionnaireKey | null {
  const canonical = (Object.keys(criteria) as Position[]).find(key => normalize(criteria[key].name) === normalize(position))
  return canonical ? `v2_${phase}_${canonical}` : null
}

function buildQuestionnaire(phase: Phase, position: Position) {
  const [phaseName, technical, tactical, physical, behavior] = phases[phase]
  const key = `v2_${phase}_${position}` as const
  function questions(block: BlocoOvr, context: string, icon: string, attributes: CardAttribute[]) {
    return criteria[position][block].map((criterion, index) => ({
      key: `${key}_${block}_${index + 1}`,
      label: `${context}, o atleta ${criterion}?`,
      icon,
      block,
      attribute: attributes[index],
    }))
  }
  const questionnaire = {
    label: `${phaseName} — ${criteria[position].name}`,
    blocoA: [
      ...questions('tecnico', technical, '⚽', ['TEC', 'TEC', 'TEC', 'DRI', 'DRI', 'TEC', 'TEC']),
      ...questions('tatico', tactical, '🧠', ['TAT', 'TAT', 'TAT', 'TAT', 'TAT']),
    ],
    blocoB: questions('comportamento', behavior, '🎭', ['POS', 'POS', 'POS']),
    blocoC: questions('fisico', physical, '💪', ['VEL', 'VEL', 'FIS', 'FIS', 'FIS']),
  }
  return [key, questionnaire] as const
}

export const positionQuestionnaires = Object.fromEntries(
  (Object.keys(phases) as Phase[]).flatMap(phase =>
    (Object.keys(criteria) as Position[]).map(position => buildQuestionnaire(phase, position)),
  ),
) as Record<PositionQuestionnaireKey, ReturnType<typeof buildQuestionnaire>[1]>
