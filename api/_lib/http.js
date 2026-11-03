// api/_lib/http.js — Helper respons & error standar
export function ok(res, data, status = 200) {
  res.setHeader('Content-Type', 'application/json')
  res.status(status).json({ ok: true, ...data })
}

export function err(res, message, status = 400) {
  res.setHeader('Content-Type', 'application/json')
  res.status(status).json({ ok: false, error: message })
}

export function methodNotAllowed(res, allowed = ['GET']) {
  res.setHeader('Allow', allowed.join(', '))
  err(res, 'Method tidak diizinkan.', 405)
}

// Bungkus handler agar crash tidak balik sebagai HTML 500
export function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (e) {
      console.error('[API Error]', e)
      err(res, 'Terjadi kesalahan server. Coba lagi.', 500)
    }
  }
}
