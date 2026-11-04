// public/sw.js — Minimal Service Worker untuk syarat instalasi PWA & Push Notifications
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

// Web Push Notification Listener
self.addEventListener('push', (event) => {
  let data = {
    title: 'Tabungan Couple',
    body: 'Yuk cek tabungan harian kalian!',
    url: '/',
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch {
      data.body = event.data.text()
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.svg',
    badge: '/pwa-192x192.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Klik Notifikasi membuka PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Jika tab sudah terbuka, bawa ke depan
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus()
        }
      }
      // Jika belum terbuka, buka window baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})
