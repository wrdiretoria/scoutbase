import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'

export default async function ProfilePage() {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) redirect('/login?next=%2Fperfil')
  const routes: Record<string, string> = {
    atleta: '/atleta/perfil', treinador: '/treinador/perfil',
    scout: '/scout/perfil', clube: '/clube/perfil',
    escola: '/clube/perfil', pais: '/pais/perfil',
  }
  redirect(routes[String(user.user_metadata?.tipo)] ?? '/cadastro')
}
