import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

type Plataforma = 'youtube' | 'tiktok' | 'instagram' | 'vimeo'

function parseVideoUrl(raw: string): { plataforma: Plataforma; videoId: string; thumbnail: string } | null {
  const url = raw.trim()

  // YouTube
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return { plataforma: 'youtube', videoId: yt[1], thumbnail: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg` }

  // Vimeo
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vi) return { plataforma: 'vimeo', videoId: vi[1], thumbnail: '' }

  // TikTok
  const tt = url.match(/tiktok\.com\/@[\w.]+\/video\/(\d+)/)
  if (tt) return { plataforma: 'tiktok', videoId: tt[1], thumbnail: '' }

  // Instagram
  const ig = url.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/)
  if (ig) return { plataforma: 'instagram', videoId: ig[1], thumbnail: '' }

  return null
}

async function fetchOembedTitle(plataforma: Plataforma, url: string): Promise<string | null> {
  try {
    const endpointMap: Partial<Record<Plataforma, string>> = {
      youtube: `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      vimeo:   `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`,
      tiktok:  `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
    }
    const endpoint = endpointMap[plataforma]
    if (!endpoint) return null

    const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json() as { title?: string }
    return data.title ?? null
  } catch {
    return null
  }
}

// ── GET — lista highlights do atleta logado ───────────────────────────────────

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[highlights GET]', error)
      return NextResponse.json({ highlights: [] })
    }

    return NextResponse.json({ highlights: data ?? [] })
  } catch (err) {
    console.error('[highlights GET] unexpected', err)
    return NextResponse.json({ highlights: [] })
  }
}

// ── POST — adiciona highlight ─────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { url } = await req.json() as { url?: string }
    if (!url?.trim()) return NextResponse.json({ error: 'URL obrigatória.' }, { status: 400 })

    const parsed = parseVideoUrl(url)
    if (!parsed) {
      return NextResponse.json(
        { error: 'URL não reconhecida. Use YouTube, TikTok, Instagram ou Vimeo.' },
        { status: 422 }
      )
    }

    const { plataforma, videoId, thumbnail } = parsed

    // Busca título via oEmbed (não bloqueia se falhar)
    const titulo = await fetchOembedTitle(plataforma, url.trim())

    const { data, error } = await supabase
      .from('highlights')
      .insert({
        profile_id:    user.id,
        url:           url.trim(),
        plataforma,
        video_id:      videoId,
        titulo:        titulo ?? null,
        thumbnail_url: thumbnail || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[highlights POST]', error)
      return NextResponse.json({ error: 'Erro ao salvar highlight.' }, { status: 500 })
    }

    return NextResponse.json({ highlight: data }, { status: 201 })
  } catch (err) {
    console.error('[highlights POST] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
