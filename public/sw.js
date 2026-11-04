// public/sw.js — Minimal Service Worker untuk syarat instalasi PWA
const CACHE_NAME = 'tabung-couple-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // JANGAN cache endpoint API, auth cookie, atau non-GET
  if (url.pathname.startsWith('/api') || event.request.method !== 'GET') {
    return
  }

  // Network-first untuk aset web umum
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
