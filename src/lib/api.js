// src/lib/api.js — Wrapper fetch terpusat
const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  // Cek Content-Type sebelum parse JSON
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    // Server mengembalikan non-JSON (HTML error page, dsb.)
    const text = await res.text()
    const error = new Error(`Server error (${res.status}): ${text.slice(0, 120)}`)
    error.status = res.status
    throw error
  }

  const data = await res.json()

  if (!res.ok) {
    const error = new Error(data.error ?? 'Terjadi kesalahan. Coba lagi.')
    error.status = res.status
    throw error
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}
