import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas de API que não exigem sessão
const PUBLIC_API_PREFIXES = [
  '/api/landing/',
  '/api/cadastro/',
  '/api/auth/',
  '/api/atleta/recuperar-id',
  '/api/atleta/recuperar-senha',
  '/api/atleta/gerar-id',
  '/api/treinador/recuperar-id',
  '/api/pais/',
  '/api/cron/',
  '/api/asaas/webhook',
]

function isPublicRoute(pathname: string): boolean {
  if (!pathname.startsWith('/api/')) return true
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
