// public/sw.js — Minimal Service Worker untuk syarat instalasi PWA
const CACHE_NAME = 'tabung-couple-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Biarkan fetch jaringan normal (network-first)
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
