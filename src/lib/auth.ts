import type { SupabaseClient, User } from '@supabase/supabase-js'

/**
 * Busca todos os usuários do Supabase Auth paginando automaticamente.
 * Substitui `listUsers({ perPage: 1000 })` que quebra com >1000 usuários.
 */
export async function listAllUsers(admin: SupabaseClient): Promise<User[]> {
  const all: User[] = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    all.push(...data.users)
    if (!data.nextPage) break
    page = data.nextPage
  }

  return all
}
