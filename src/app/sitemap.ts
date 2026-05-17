import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase'

const BASE = 'https://meucraque.com.br'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                        priority: 1.0,  changeFrequency: 'weekly'  },
    { url: `${BASE}/ranking`,           priority: 0.9,  changeFrequency: 'daily'   },
    { url: `${BASE}/scout/busca`,       priority: 0.85, changeFrequency: 'daily'   },
    { url: `${BASE}/atleta/cadastro`,   priority: 0.8,  changeFrequency: 'monthly' },
    { url: `${BASE}/treinador/cadastro`,priority: 0.7,  changeFrequency: 'monthly' },
    { url: `${BASE}/scout/cadastro`,    priority: 0.7,  changeFrequency: 'monthly' },
    { url: `${BASE}/login`,             priority: 0.5,  changeFrequency: 'monthly' },
  ]

  // Perfis públicos dos atletas
  try {
    const admin = createAdminClient()
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const atletas = users.filter(u => u.user_metadata?.tipo === 'atleta')

    const atletaPages: MetadataRoute.Sitemap = atletas.map(u => ({
      url:              `${BASE}/jogador/${u.id}`,
      lastModified:     new Date(u.updated_at ?? u.created_at ?? Date.now()),
      priority:         0.7,
      changeFrequency:  'weekly' as const,
    }))

    return [...staticPages, ...atletaPages]
  } catch {
    return staticPages
  }
}
