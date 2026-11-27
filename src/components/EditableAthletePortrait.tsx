'use client'
import { useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import AthletePortrait from './AthletePortrait'

async function preparePhoto(file: File): Promise<Blob> {
  const src = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Não foi possível abrir essa imagem.')); image.src = src })
    const ratio = Math.min(900 / image.width, 900 / image.height, 1)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(image.width * ratio)
    canvas.height = Math.round(image.height * ratio)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível preparar a foto.')
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível preparar a foto.')), 'image/jpeg', .85))
  } finally { URL.revokeObjectURL(src) }
}

export default function EditableAthletePortrait({ src, name, initials }: { src: string | null; name: string; initials: string }) {
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [savedPhoto, setSavedPhoto] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function change(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || busy) return
    setBusy(true)
    setMessage('')
    try {
      const body = new FormData()
      body.append('file', new File([await preparePhoto(file)], 'photo.jpg', { type: 'image/jpeg' }))
      const response = await fetch('/api/atleta/upload-foto', { method: 'POST', body })
      const data = await response.json() as { url?: string; error?: string }
      if (!response.ok || !data.url) throw new Error(data.error || 'Não foi possível salvar a foto.')
      setSavedPhoto(data.url)
      setMessage('Foto atualizada! A novidade já está na comunidade.')
      router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível trocar a foto. Tente novamente.') }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }
  return <div>
    <AthletePortrait src={savedPhoto || src} name={name} initials={initials} />
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Escolher nova foto de perfil" disabled={busy} hidden onChange={change} />
    <button type="button" onClick={() => input.current?.click()} disabled={busy} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      width: '100%', minHeight: 48, marginTop: 14, borderRadius: 12, border: 0,
      background: '#b3f737', color: '#08120d', font: 'inherit', fontWeight: 800,
      cursor: busy ? 'wait' : 'pointer', opacity: busy ? .7 : 1,
    }}><span aria-hidden="true">📷</span>{busy ? 'Salvando foto…' : 'Trocar foto'}</button>
    {message && <p role="status" style={{ fontSize: 13, lineHeight: 1.5, color: '#d4e0d7' }}>{message}</p>}
  </div>
}
