// POST /api/auth/logout
import { clearSessionCookie } from '../_lib/auth.js'
import { ok, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
  clearSessionCookie(res)
  ok(res, { message: 'Berhasil keluar.' })
}

export default withErrorHandler(handler)
