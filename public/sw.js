const CACHE_NAME = 'meucraque-v3'

// Recursos essenciais pré-cacheados no install
const STATIC_CACHE = [
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon.svg',
  '/manifest.json',
]

// ── Install: pré-cacheia recursos essenciais ──────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE))
  )
  self.skipWaiting()
})

// ── Activate: limpa caches antigos ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch: network-first com fallback para offline ────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Só intercepta GET da mesma origem
  if (request.method !== 'GET') return
  if (!request.url.startsWith(self.location.origin)) return

  // APIs, auth e HMR: sempre rede — nunca cache
  if (
    request.url.includes('/api/') ||
    request.url.includes('supabase.co') ||
    request.url.includes('/_next/webpack-hmr')
  ) return

  // Recursos estáticos Next.js (_next/static): cache-first
  if (request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Ícones e assets públicos: cache-first
  if (
    request.url.includes('/icons/') ||
    request.url.includes('/images/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        }).catch(() => new Response('', { status: 404 }))
      })
    )
    return
  }

  // Dados de navegação do Next.js e páginas autenticadas usam sempre a rede.
  if (request.mode !== 'navigate') return

  event.respondWith(
    fetch(request).catch(async () => {
      const offline = await caches.match('/offline')
      return offline || new Response('Sem conexão. Tente novamente.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    })
  )
})
