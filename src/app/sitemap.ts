import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { SERVER_BASE_URL } from '@/lib/base-url'

const BASE = SERVER_BASE_URL

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

  // Perfis públicos dos atletas — query direta em profiles, sem listAllUsers
  try {
    const admin = createAdminClient()
    const { data: atletas } = await admin
      .from('profiles')
      .select('id, updated_at, created_at')
      .like('athlete_id', 'MC-%')

    const atletaPages: MetadataRoute.Sitemap = (atletas ?? []).map(p => ({
      url:             `${BASE}/jogador/${p.id as string}`,
      lastModified:    new Date((p.updated_at ?? p.created_at ?? Date.now()) as string),
      priority:        0.7,
      changeFrequency: 'weekly' as const,
    }))

    return [...staticPages, ...atletaPages]
  } catch {
    return staticPages
  }
}
