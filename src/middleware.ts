/**
 * Middleware de proteção de rotas
 * - Renova o token de sessão do Supabase em toda requisição (obrigatório para SSR)
 * - Redireciona usuários não autenticados para /login em rotas privadas
 * - Redireciona usuários autenticados para fora de /login e páginas de cadastro
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Prefixos de rotas que exigem sessão ativa */
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
  '/scout/dashboard',
  '/scout/busca',
  '/scout/favoritos',
  '/admin',
  '/dashboard',
  '/agenda',
  '/alunos',
  '/configuracoes',
  '/financeiro',
  '/presencas',
  '/ranking',
  '/relatorios',
  '/turmas',
]

/** Rotas de entrada que usuários autenticados devem ser redirecionados para fora */
const AUTH_ROUTES = ['/login']

function isPrivate(pathname: string) {
  return PRIVATE_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
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

  // IMPORTANTE: não executar código entre createServerClient e getUser
  // pois cookies precisam estar sincronizados
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rota privada sem sessão → /login
  if (isPrivate(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Já logado tentando acessar /login → redireciona para perfil
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
    /*
     * Executa em todas as rotas EXCETO:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico
     * - arquivos com extensão (js, css, png, etc.)
     * - rotas de API (gerenciam própria auth)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$|api/).*)',
  ],
}
