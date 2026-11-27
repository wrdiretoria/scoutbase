import { highlightSkills } from './highlight-skills'

type MissionInput = {
  avatarUrl: string | null
  position: string | null
  city: string | null
  birthDate: string | null
  bio: string | null
  photos: unknown
  highlights: { titulo: string | null; url: string }[]
}
export type AthleteMission = { id: string; group: string; title: string; description: string; href: string; done: boolean }
const present = (value: string | null) => !!value?.trim()
const hasLink = (value: string) => { try { return ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false } }

export function athleteMissions(input: MissionInput): AthleteMission[] {
  const photos = Array.isArray(input.photos) ? input.photos.filter(photo => typeof photo === 'string' && hasLink(photo)) : []
  const photoCount = new Set(photos).size
  return [
    { id: 'photo', group: 'Sua identidade', title: 'Escolha sua foto principal', description: 'Use uma foto sua, sozinho e de frente para apresentar seu perfil.', href: '/atleta/perfil#foto', done: present(input.avatarUrl) },
    { id: 'identity', group: 'Sua identidade', title: 'Complete seus dados esportivos', description: 'Informe posição, cidade e data de nascimento para aparecer na categoria certa.', href: '/atleta/perfil#identidade', done: present(input.position) && present(input.city) && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(input.birthDate ?? '') },
    { id: 'bio', group: 'Sua identidade', title: 'Conte quem você é no futebol', description: 'Escreva sua apresentação no currículo e conte o que você busca no futebol.', href: '/atleta/perfil#curriculo', done: present(input.bio) },
    ...highlightSkills.map((skill, index) => ({
      id: 'skill-' + index, group: 'Mostre seu futebol', title: skill,
      description: 'Treine essa habilidade, grave um lance em que você aparece e salve o link na sua grade de vídeos.',
      href: '/atleta/perfil#highlight-task-' + index,
      done: input.highlights.some(video => video.titulo === skill && hasLink(video.url)),
    })),
    { id: 'action-photos', group: 'Sua presença em campo', title: 'Adicione 3 fotos de ação', description: photoCount + ' de 3 fotos. Mostre momentos de treino ou jogo na sua galeria.', href: '/atleta/perfil#fotos-acao', done: photoCount >= 3 },
  ]
}
