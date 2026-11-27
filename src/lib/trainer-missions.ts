type Input = { avatarUrl: string | null; bio: string | null; metadata: Record<string, unknown>; hasPublication: boolean }
const filled = (value: unknown) => typeof value === 'string' && !!value.trim()
export function trainerMissions(input: Input) {
  const m = input.metadata
  return [
    { id:'photo', group:'Sua identidade profissional', title:'Escolha sua foto profissional', description:'Use uma foto sua para apresentar seu trabalho à comunidade.', href:'/treinador/curriculo#foto', done:filled(input.avatarUrl) },
    { id:'specialty', group:'Sua identidade profissional', title:'Informe sua área de atuação', description:'Preencha sua especialidade para que atletas entendam como você trabalha.', href:'/treinador/curriculo#identidade', done:filled(m.especialidade) },
    { id:'location', group:'Sua identidade profissional', title:'Informe onde você atua', description:'Adicione sua cidade ao currículo.', href:'/treinador/curriculo#identidade', done:filled(m.cidade) },
    { id:'bio', group:'Sua identidade profissional', title:'Apresente sua forma de trabalhar', description:'Conte sua história, sua metodologia e como você ajuda atletas.', href:'/treinador/curriculo#apresentacao', done:filled(input.bio) },
    { id:'current', group:'Sua experiência', title:'Mostre seu trabalho atual', description:'Conte onde atua hoje, inclusive se trabalha de forma independente.', href:'/treinador/curriculo#historico', done:filled(m.clube_atual) },
    { id:'history', group:'Sua experiência', title:'Registre sua trajetória profissional', description:'Conte os projetos, clubes ou escolas em que você já trabalhou.', href:'/treinador/curriculo#historico', done:filled(m.clubes_trabalhados) },
    { id:'education', group:'Sua experiência', title:'Apresente sua formação', description:'Registre cursos, certificações ou formação em andamento.', href:'/treinador/curriculo#historico', done:filled(m.certificacoes) },
    { id:'video', group:'Mostre seu trabalho', title:'Adicione um vídeo ou seu canal', description:'Coloque seu YouTube ou um link do seu trabalho nas redes do currículo.', href:'/treinador/curriculo#redes', done:filled(m.youtube) || (typeof m.outras === 'string' && /^https?:/.test(m.outras)) },
    { id:'publication', group:'Mostre seu trabalho', title:'Compartilhe uma ideia na comunidade', description:'Publique um treino, uma orientação ou uma experiência sua na Home.', href:'/#feed-composer', done:input.hasPublication },
  ]
}
