// GET /api/auth/me
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const [user] = await sql`
    SELECT u.id, u.name, u.email,
           cm.couple_id
    FROM users u
    LEFT JOIN couple_members cm ON cm.user_id = u.id
    WHERE u.id = ${payload.sub}
    LIMIT 1
  `

  if (!user) return err(res, 'Pengguna tidak ditemukan.', 404)

  ok(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      coupleId: user.couple_id ?? null,
    },
  })
}

export default withErrorHandler(handler)
