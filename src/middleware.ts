import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rotas de página que exigem sessão ativa
const PROTECTED_PAGES = [
  '/atleta/perfil',
  '/atleta/questionario',
  '/atleta/historico',
  '/atleta/promover',
  '/atleta/carta',
  '/atleta/compartilhar',
  '/atleta/bem-vindo',
  '/treinador/dashboard',
  '/treinador/perfil',
  '/treinador/avaliar',
  '/treinador/configurar',
  '/treinador/curriculo',
  '/treinador/compartilhar',
  '/treinador/bem-vindo',
  '/treinador/questionario',
]

// Prefixos de API que exigem sessão ativa
const PROTECTED_API_PREFIXES = [
  '/api/atleta/',
  '/api/treinador/',
  '/api/convite/',
  '/api/financeiro/',
  '/api/aceite-termos',
]

// API routes públicas dentro dos prefixos protegidos acima
const PUBLIC_API_EXCEPTIONS = [
  '/api/atleta/recuperar-senha',
  '/api/atleta/upload-foto-cadastro',
  '/api/atleta/gerar-id',
  '/api/atleta/salvar-perfil',
  '/api/atleta/visita',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtectedPage = PROTECTED_PAGES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isProtectedApi  = PROTECTED_API_PREFIXES.some(p => pathname.startsWith(p))
                       && !PUBLIC_API_EXCEPTIONS.some(p => pathname.startsWith(p))

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next()
  }

  // Cria resposta mutável para que o Supabase possa renovar cookies de sessão
  const response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: ()                   => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    // Página protegida → redireciona para login mantendo destino
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/entrar'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/atleta/:path*',
    '/treinador/:path*',
    '/api/atleta/:path*',
    '/api/treinador/:path*',
    '/api/convite/:path*',
    '/api/financeiro/:path*',
    '/api/aceite-termos',
  ],
}
