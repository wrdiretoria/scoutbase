'use client'
import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import MainAccountNav from '@/components/MainAccountNav'

const fields = [
  ['nome', 'Nome completo'], ['cidade', 'Cidade'], ['organizacao', 'Organização'],
  ['instagram', 'Instagram'], ['bio', 'Sua atuação no futebol'],
] as const
type Field = typeof fields[number][0]

export default function ScoutProfilePage() {
  const router = useRouter()
  const [values, setValues] = useState<Record<Field, string>>({ nome: '', cidade: '', organizacao: '', instagram: '', bio: '' })
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const client = createClient()
        const { data: { user }, error } = await client.auth.getUser()
        if (error) throw error
        if (!user) { router.replace('/login?area=scout&next=%2Fperfil'); return }
        if (user.user_metadata?.tipo !== 'scout') { router.replace('/perfil'); return }
        if (!cancelled) {
          setValues(Object.fromEntries(fields.map(([key]) => [key, String(user.user_metadata?.[key] ?? '')])) as Record<Field, string>)
          setReady(true)
        }
      } catch { if (!cancelled) setMessage('Não foi possível carregar sua ficha. Atualize a página para tentar novamente.') }
    }
    void load()
    return () => { cancelled = true }
  }, [router])

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const client = createClient()
      const { data: { user } } = await client.auth.getUser()
      if (!user) { router.replace('/login?next=%2Fperfil'); return }
      const clean = Object.fromEntries(fields.map(([key]) => [key, values[key].trim()]))
      const { error } = await client.auth.updateUser({ data: clean })
      if (error) throw error
      const { data, error: profileError } = await client.from('profiles').update({ nome: clean.nome }).eq('id', user.id).select('id').maybeSingle()
      if (profileError || !data) { setMessage('Sua ficha foi salva, mas o nome no feed não foi atualizado. Tente salvar novamente.'); return }
      setMessage('Ficha salva com sucesso.')
      router.refresh()
    } catch { setMessage('Não foi possível salvar. Tente novamente.') }
    finally { setSaving(false) }
  }

  return <main style={{ minHeight: '100vh', background: 'var(--mc-canvas)', color: 'var(--mc-text)', padding: '24px 16px 110px' }}>
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <Link href="/" style={{ color: '#b3f737', fontWeight: 800 }}>⚽ MEUCRAQUE.com</Link>
      <h1>Meu perfil de scout</h1>
      <p>Preencha sua ficha e apresente sua atuação na comunidade.</p>
      {!ready && !message && <p role="status">Carregando sua ficha…</p>}
      {ready && <form onSubmit={save} style={{ display: 'grid', gap: 18, marginTop: 24 }}>
        {fields.map(([key, label]) => <label key={key} style={{ display: 'grid', gap: 8, fontWeight: 700 }}>
          {label}
          {key === 'bio' ? <textarea value={values[key]} maxLength={1000} rows={4} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
            style={{ width: '100%', boxSizing: 'border-box', background: '#102019', border: '1px solid #385346', borderRadius: 12, color: 'white', font: 'inherit', padding: 14 }} />
            : <input value={values[key]} required={key === 'nome' || key === 'cidade'} maxLength={150} autoComplete={key === 'nome' ? 'name' : key === 'cidade' ? 'address-level2' : 'off'}
              onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
              style={{ width: '100%', boxSizing: 'border-box', background: '#102019', border: '1px solid #385346', borderRadius: 12, color: 'white', font: 'inherit', padding: 14 }} />}
        </label>)}
        <button disabled={saving} style={{ minHeight: 48, border: 0, borderRadius: 12, background: '#b3f737', color: '#081008', font: 'inherit', fontWeight: 800 }}>{saving ? 'Salvando…' : 'Salvar minha ficha'}</button>
      </form>}
      {message && <p role="status">{message}</p>}
      <nav aria-label="Ferramentas do scout" style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 28 }}>
        <Link href="/scout/favoritos">Meus favoritos</Link>
        <Link href="/scout/busca">Buscar atletas</Link>
        <Link href="/scout/dashboard">Meu painel</Link>
      </nav>
      <button type="button" onClick={async () => {
        const { error } = await createClient().auth.signOut()
        if (error) { setMessage('Não foi possível sair. Tente novamente.'); return }
        window.location.replace('/')
      }} style={{ marginTop: 24, minHeight: 44, background: 'none', color: '#c4d0c9', border: '1px solid #385346', borderRadius: 10, padding: '8px 18px' }}>Sair da conta</button>
    </div>
    <MainAccountNav />
  </main>
}
