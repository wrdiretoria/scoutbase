'use client'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FeedStory, STORY_MAX_BYTES, STORY_TYPES } from '@/lib/feed-stories'
import styles from './FeedStories.module.css'

type CurrentUser = { id: string; name: string; avatarUrl: string | null }
export default function FeedStories({ user }: { user: CurrentUser | null }) {
  const [stories, setStories] = useState<FeedStory[]>([])
  const [loading, setLoading] = useState(!!user)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'publish' | 'viewer' | null>(null)
  const [index, setIndex] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [caption, setCaption] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const signIn = '/login?next=%2Ffeed'
  const load = useCallback(async () => {
    if (!user) return [] as FeedStory[]
    try {
      const response = await fetch('/api/stories', { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Não foi possível carregar.')
      const active = (body.stories as FeedStory[]).filter(s => Date.parse(s.expiresAt) > Date.now())
      setStories(active)
      return active
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar as atualizações.')
      return null
    } finally { setLoading(false) }
  }, [user])
  useEffect(() => {
    if (mode) return
    void load()
    if (!user) return
    const timer = setInterval(() => { void load() }, 60000)
    return () => clearInterval(timer)
  }, [load, user, mode])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  useEffect(() => {
    const element = dialog.current
    if (mode && element && !element.open) {
      returnFocus.current = document.activeElement as HTMLElement | null
      element.showModal()
    } else if (!mode && element?.open) {
      element.close()
      returnFocus.current?.focus()
    }
  }, [mode])
  const groups = useMemo(() => {
    const map = new Map<string, FeedStory[]>()
    for (const story of stories) map.set(story.authorId, [...(map.get(story.authorId) ?? []), story])
    return [...map.values()].sort((a,b) => Number(a.every(s => s.seen)) - Number(b.every(s => s.seen)))
  }, [stories])
  const current = stories[index]
  const close = useCallback(() => { setMode(null); setPaused(false); setReady(false); setError('') }, [])
  const move = useCallback((direction: number) => {
    const target = stories[index + direction]
    if (!target) { if (direction > 0) close(); return }
    setError(''); setReady(false); setPaused(false); setBusy(true)
    void load().then(fresh => {
      if (!fresh) return
      const nextIndex = fresh.findIndex(story => story.id === target.id)
      if (nextIndex < 0) { close(); return }
      setIndex(nextIndex)
    }).finally(() => setBusy(false))
  }, [index, stories, close, load])
  useEffect(() => {
    if (mode !== 'viewer' || !current || !ready || paused || busy) return
    if (current.mediaType === 'video') return
    const timer = setTimeout(() => move(1), 7000)
    return () => clearTimeout(timer)
  }, [mode, current, ready, paused, busy, move])
  useEffect(() => {
    if (mode !== 'viewer' || busy) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') move(1)
      if (event.key === 'ArrowLeft') move(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mode, busy, move])
  useEffect(() => {
    if (mode !== 'viewer' || !current) return
    const remaining = Date.parse(current.expiresAt) - Date.now()
    const timer = setTimeout(() => { close(); setError('Essa atualização expirou.') }, Math.max(0, remaining))
    return () => clearTimeout(timer)
  }, [mode, current, close])
  const markViewed = async (story: FeedStory) => {
    setReady(true)
    if (story.seen) return
    const response = await fetch(`/api/stories/${story.id}/view`, { method: 'POST' }).catch(() => null)
    if (response?.ok) setStories(list => list.map(s => s.id === story.id ? { ...s, seen: true } : s))
  }
  const open = async (id: string) => {
    setError(''); setBusy(true)
    const fresh = await load()
    setBusy(false)
    if (!fresh) return
    const found = fresh.findIndex(s => s.id === id)
    if (found < 0) { setError('Essa atualização expirou ou foi removida.'); return }
    setIndex(found); setReady(false); setPaused(false); setMode('viewer')
  }
  const chooseFile = (selected?: File) => {
    setError('')
    if (!selected) return
    if (!STORY_TYPES[selected.type]) { setError('Use JPG, PNG, WebP ou vídeo MP4/WebM.'); return }
    if (selected.size > STORY_MAX_BYTES) { setError('O arquivo deve ter até 8 MB.'); return }
    setFile(selected); setPreview(URL.createObjectURL(selected))
  }
  const publish = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file || busy) return
    setBusy(true); setError('')
    try {
      const data = new FormData(); data.set('file', file); data.set('caption', caption)
      const response = await fetch('/api/stories', { method: 'POST', body: data })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Não foi possível publicar.')
      setFile(null); setPreview(''); setCaption(''); close(); await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao publicar.') }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!current || busy || !window.confirm('Excluir esta atualização?')) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/stories/${current.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error((await response.json()).error || 'Não foi possível excluir.')
      close(); await load()
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao excluir.') }
    finally { setBusy(false) }
  }
  const togglePause = () => {
    if (video.current) {
      if (paused) void video.current.play().catch(() => setError('Toque no vídeo para reproduzir.'))
      else video.current.pause()
    }
    setPaused(!paused)
  }
  const initials = (name: string) => name.split(' ').slice(0,2).map(s => s[0]).join('').toUpperCase()
  return <section className={styles.section} aria-label="Atualizações da comunidade">
    <div className={styles.row}>
      {user ? <button className={styles.story} onClick={() => { setError(''); setMode('publish') }}>
        <span className={`${styles.ring} ${styles.add}`} aria-hidden="true">+</span><span>Sua atualização</span>
      </button> : <Link className={styles.story} href={signIn}><span className={`${styles.ring} ${styles.add}`} aria-hidden="true">+</span><span>Sua atualização</span></Link>}
      {groups.map(group => <button key={group[0].authorId} className={styles.story} disabled={busy}
        aria-label={`Ver atualizações de ${group[0].authorName}${group.every(s => s.seen) ? ', já vistas' : ', novas'}`}
        onClick={() => void open((group.find(s => !s.seen) ?? group[group.length - 1]).id)}>
        <span className={`${styles.ring} ${group.every(s => s.seen) ? styles.seen : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {group[0].avatarUrl ? <img src={group[0].avatarUrl} alt="" /> : <span>{initials(group[0].authorName)}</span>}
        </span><span className={styles.name}>{group[0].authorId === user?.id ? 'Você' : group[0].authorName.split(' ')[0]}</span>
      </button>)}
      {!groups.length && <p className={styles.hint}>{loading ? 'Carregando atualizações…' : user ? 'Compartilhe seu futebol. As atualizações ficam disponíveis por 24 horas.' : 'Entre para acompanhar as atualizações da comunidade.'}</p>}
    </div>
    {error && !mode && <p className={styles.error} role="alert">{error} <button onClick={() => { setError(''); void load() }}>Tentar novamente</button></p>}
    <dialog ref={dialog} className={styles.dialog} aria-label={mode === 'publish' ? 'Publicar atualização' : 'Visualizar atualização'}
      onCancel={event => { if (busy) event.preventDefault(); else close() }}>
      <div className={styles.dialogBody}>
        <button className={styles.close} aria-label="Fechar" disabled={busy} onClick={close}>×</button>
        {mode === 'publish' && <form onSubmit={publish} className={styles.form}>
          <h2>Sua atualização</h2><p>Uma foto ou vídeo do seu futebol, disponível por 24 horas para quem está na comunidade.</p>
          <label className={styles.file}>Escolher foto ou vídeo<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={busy} onChange={e => chooseFile(e.target.files?.[0])} /></label>
          <small>Até 8 MB. JPG, PNG, WebP, MP4 ou WebM.</small>
          {preview && (file?.type.startsWith('video/') ? <video src={preview} controls className={styles.preview} /> :
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className={styles.preview} src={preview} alt="Prévia da sua atualização" />)}
          <label>Legenda opcional<textarea value={caption} maxLength={240} disabled={busy} onChange={e => setCaption(e.target.value)} placeholder="Conte o que está acontecendo…" /></label>
          <small>{caption.length}/240</small>
          <button className={styles.primary} disabled={!file || busy} type="submit">{busy ? 'Publicando…' : 'Publicar atualização'}</button>
        </form>}
        {mode === 'viewer' && current && <div className={styles.viewer}>
          <div className={styles.steps} aria-label={`Atualização ${index + 1} de ${stories.length}`}>
            {stories.map((s,i) => <span key={s.id} className={i <= index ? styles.stepActive : ''} />)}
          </div>
          <header className={styles.viewerHeader}><strong>{current.authorName}</strong><small>{new Date(current.createdAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</small></header>
          {current.mediaType === 'video' ?
            <video key={current.id} ref={video} src={current.mediaUrl} controls autoPlay playsInline onEnded={() => move(1)} onPause={() => setPaused(true)} onPlay={() => setPaused(false)} onLoadedData={() => void markViewed(current)} onError={() => setError('Não foi possível abrir o vídeo. Feche e tente novamente.')} /> :
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={current.id} src={current.mediaUrl} alt={current.caption || `Atualização de ${current.authorName}`} onLoad={() => void markViewed(current)} onError={() => setError('Não foi possível abrir a foto. Feche e tente novamente.')} />}
          {current.caption && <p className={styles.caption}>{current.caption}</p>}
          <footer className={styles.viewerFooter}>
            <button aria-label="Atualização anterior" disabled={index === 0 || busy} onClick={() => move(-1)}>‹</button>
            <button onClick={togglePause} disabled={!ready}>{paused ? 'Continuar' : 'Pausar'}</button>
            {current.authorId === user?.id && <button onClick={() => void remove()} disabled={busy}>{busy ? 'Excluindo…' : 'Excluir'}</button>}
            <button aria-label="Próxima atualização" disabled={busy} onClick={() => move(1)}>›</button>
          </footer>
        </div>}
        {error && mode && <p className={styles.error} role="alert">{error}</p>}
      </div>
    </dialog>
  </section>
}
