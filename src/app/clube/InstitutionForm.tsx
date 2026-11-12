'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { isValidCnpj } from '@/lib/cnpj'
import type { Institution } from '@/lib/institution'
import styles from './institution.module.css'

export default function InstitutionForm({ initial, signedIn = false }: { initial?: Institution; signedIn?: boolean }) {
  const [kind, setKind] = useState(initial?.kind || 'clube')
  const [cnpj, setCnpj] = useState(initial?.cnpj || '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError('')
    setMessage('')
    if ((kind === 'clube' || cnpj.trim()) && !isValidCnpj(cnpj)) {
      setError('Confira o CNPJ informado.')
      return
    }
    const form = new FormData(event.currentTarget)
    const body = Object.fromEntries(form.entries())
    setBusy(true)
    try {
      const response = await fetch(signedIn ? '/api/clube/perfil' : '/api/cadastro/instituicao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, kind, cnpj, acceptedTerms: form.has('terms') }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar.')
      if (result.needsConfirmation) {
        setMessage('Cadastro recebido. Confira seu e-mail para confirmar o acesso. Depois entre na conta da instituição.')
        return
      }
      window.location.replace('/clube/perfil')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Confira sua conexão e tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    setBusy(true)
    try {
      const { error } = await createClient().auth.signOut()
      if (error) throw error
      window.location.replace('/')
    } catch {
      setError('Não foi possível sair. Tente novamente.')
      setBusy(false)
    }
  }

  return (
    <>
      <form onSubmit={save} className={styles.form}>
        <fieldset disabled={busy || !!message} className={styles.fields}>
          <legend>Dados da instituição</legend>
          <label htmlFor="institution-kind">Tipo de instituição</label>
          <select id="institution-kind" name="kind" value={kind} onChange={e => setKind(e.target.value as 'clube' | 'escolinha')}>
            <option value="clube">Clube</option>
            <option value="escolinha">Escolinha</option>
          </select>
          <label htmlFor="institution-name">Nome da instituição</label>
          <input id="institution-name" name="nome" required minLength={2} maxLength={160} defaultValue={initial?.nome} autoComplete="organization" />
          <label htmlFor="institution-cnpj">CNPJ da instituição responsável{kind === 'escolinha' ? ' (opcional)' : ''}</label>
          <input id="institution-cnpj" name="cnpj" required={kind === 'clube'} maxLength={18} value={cnpj} onChange={e => setCnpj(e.target.value.toUpperCase())} autoCapitalize="characters" spellCheck={false} aria-describedby="cnpj-help" />
          <small id="cnpj-help">{kind === 'escolinha' ? 'Sem CNPJ, você pode criar o perfil da escolinha independente. O selo e a publicação de vagas exigem verificação.' : 'O selo depende da conferência do CNPJ e do vínculo do responsável.'}</small>
          <label htmlFor="institution-city">Cidade e estado</label>
          <input id="institution-city" name="cidade" required minLength={2} maxLength={160} defaultValue={initial?.cidade} placeholder="Rio de Janeiro, RJ" />
          <label htmlFor="institution-representative">Nome completo do responsável</label>
          <input id="institution-representative" name="responsavel_nome" required minLength={2} maxLength={160} defaultValue={initial?.responsavel_nome} autoComplete="name" />
          <label htmlFor="institution-position">Cargo do responsável</label>
          <input id="institution-position" name="responsavel_cargo" required minLength={2} maxLength={160} defaultValue={initial?.responsavel_cargo} placeholder="Presidente, diretor ou coordenador" />
          {!signedIn && <>
            <label htmlFor="institution-email">E-mail de acesso</label>
            <input id="institution-email" name="email" type="email" required maxLength={254} autoComplete="email" />
            <label htmlFor="institution-password">Senha</label>
            <input id="institution-password" name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" />
            <small>Use pelo menos 8 caracteres.</small>
          </>}
          {!initial && <label className={styles.terms}>
            <input type="checkbox" name="terms" required />
            <span>Declaro que posso representar a instituição e aceito os <Link href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</Link>.</span>
          </label>}
          <button type="submit" className={styles.primary}>{busy ? 'Salvando…' : initial ? 'Salvar alterações' : signedIn ? 'Concluir cadastro institucional' : 'Criar conta institucional'}</button>
        </fieldset>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        {message && <p role="status">{message}</p>}
      </form>
      {signedIn ? <button className={styles.secondary} onClick={() => void signOut()} disabled={busy}>Sair da conta</button> : <p>Já tem conta? <Link href="/login?area=clube">Entrar na instituição</Link></p>}
    </>
  )
}
