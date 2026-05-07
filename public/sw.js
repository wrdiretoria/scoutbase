const CACHE_NAME = 'scoutbase-v1'

// Recursos estáticos que ficam em cache sempre
const STATIC_CACHE = [
  '/offline',
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

  // Recursos de API e auth: sempre rede (nunca cache)
  if (
    request.url.includes('/api/') ||
    request.url.includes('supabase.co') ||
    request.url.includes('/_next/webpack-hmr')
  ) return

  // Recursos estáticos (_next/static): cache-first
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

  // Páginas HTML: network-first, cache como fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(request).then(
          (cached) => cached || caches.match('/offline')
        )
      )
  )
})
