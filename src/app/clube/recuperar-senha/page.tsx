'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import styles from '../institution.module.css'

export default function InstitutionRecoveryPage() {
  const [mode, setMode] = useState<'request' | 'checking' | 'password' | 'sent' | 'done'>('request')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('code')) return
    let cancelled = false
    setMode('checking')
    // O cliente SSR do navegador processa o código PKCE durante sua inicialização.
    createClient().auth.getUser().then(({ data: { user }, error }) => {
      if (cancelled) return
      if (error || !user) {
        setMode('request')
        setMessage('O link expirou ou não pôde ser confirmado. Solicite um novo link neste navegador.')
      } else setMode('password')
    }).catch(() => {
      if (!cancelled) { setMode('request'); setMessage('Não foi possível conferir o link. Tente novamente.') }
    })
    return () => { cancelled = true }
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setMessage('')
    try {
      const client = createClient()
      if (mode === 'password') {
        const password = String(form.get('password') || '')
        if (password !== form.get('confirmation')) throw new Error('As senhas não coincidem.')
        const { error } = await client.auth.updateUser({ password })
        if (error) throw new Error('Não foi possível alterar a senha. Solicite um novo link.')
        setMode('done')
      } else {
        const { error } = await client.auth.resetPasswordForEmail(String(form.get('email') || ''), {
          redirectTo: window.location.origin + '/clube/recuperar-senha',
        })
        if (error) throw new Error('Não foi possível enviar. Aguarde e tente novamente.')
        setMode('sent')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Confira sua conexão.')
    } finally { setBusy(false) }
  }
  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><Link href="/" className={styles.brand}>⚽ <span>MEUCRAQUE</span>.com</Link><Link href="/login?area=clube">Entrar</Link></header>
    <h1>Recuperar acesso institucional</h1>
    <section className={styles.card}>
      {mode === 'checking' ? <p role="status">Conferindo o link…</p> : mode === 'done' ? <><p>Senha atualizada.</p><Link href="/clube/perfil">Abrir meu perfil institucional</Link></> : mode === 'sent' ? <p role="status">Se o e-mail estiver cadastrado, você receberá as instruções de recuperação. Abra o link neste mesmo navegador.</p> : <form onSubmit={submit}><fieldset disabled={busy} className={styles.fields}>
        <legend>{mode === 'password' ? 'Escolha sua nova senha' : 'Receber um link por e-mail'}</legend>
        {mode === 'password' ? <><label htmlFor="new-password">Nova senha</label><input id="new-password" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /><label htmlFor="confirm-password">Confirmar senha</label><input id="confirm-password" name="confirmation" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></> : <><label htmlFor="recovery-email">E-mail da instituição</label><input id="recovery-email" name="email" type="email" required autoComplete="email" /></>}
        <button className={styles.primary} type="submit">{busy ? 'Aguarde…' : mode === 'password' ? 'Salvar nova senha' : 'Enviar link de recuperação'}</button>
      </fieldset></form>}
      {message && <p role="alert" className={styles.error}>{message}</p>}
    </section>
  </div></main>
}
