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
