import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ALWAYS_PUBLIC = [
  '/ranking',
  '/jogador',
  '/scout/busca',
  '/scout/cadastro',
  '/scout/entrar',
  '/atleta/cadastro',
  '/atleta/recuperar-id',
  '/atleta/recuperar-senha',
  '/treinador/cadastro',
  '/treinador/recuperar-id',
  '/treinador/recuperar-senha',
  '/cadastro',
  '/planos',
  '/termos',
  '/p',
]

const PRIVATE_PREFIXES = [
  '/atleta/perfil',
  '/atleta/carta',
  '/atleta/compartilhar',
  '/atleta/historico',
  '/atleta/promover',
  '/atleta/questionario',
  '/atleta/bem-vindo',
  '/treinador/dashboard',
  '/treinador/avaliar',
  '/treinador/perfil',
  '/treinador/compartilhar',
  '/treinador/configurar',
  '/treinador/nova-senha',
  '/treinador/bem-vindo',
  '/treinador/questionario',
  '/scout/dashboard',
  '/scout/favoritos',
  '/avaliacoes',
  '/pais/perfil',
  '/admin',
  '/dashboard',
  '/agenda',
  '/alunos',
  '/configuracoes',
  '/financeiro',
  '/presencas',
  '/relatorios',
  '/turmas',
]

const AUTH_ROUTES = ['/login']

const PUBLIC_API_PREFIXES = [
  '/api/landing/',
  '/api/cadastro/',
  '/api/auth/',
  '/api/atleta/recuperar-id',
  '/api/atleta/recuperar-senha',
  '/api/atleta/gerar-id',
  '/api/atleta/card-data',
  '/api/atleta/ovr',
  '/api/atleta/visita',
  '/api/treinador/recuperar-id',
  '/api/pais/',
  '/api/cron/',
  '/api/asaas/webhook',
]

function isAlwaysPublic(pathname: string) {
  return ALWAYS_PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isPrivate(pathname: string) {
  return PRIVATE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rotas de API
  if (pathname.startsWith('/api/')) {
    if (isPublicApiRoute(pathname)) return supabaseResponse
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }
    return supabaseResponse
  }

  // Rotas de página
  if (isAlwaysPublic(pathname)) return supabaseResponse

  if (isPrivate(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute(pathname) && user) {
    const tipo = user.user_metadata?.tipo as string | undefined
    const url = request.nextUrl.clone()
    if (tipo === 'treinador') {
      url.pathname = '/treinador/dashboard'
    } else if (tipo === 'scout') {
      url.pathname = '/scout/dashboard'
    } else {
      url.pathname = '/atleta/perfil'
    }
    url.searchParams.delete('next')
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}
