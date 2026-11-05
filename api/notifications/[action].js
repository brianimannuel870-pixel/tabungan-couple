// api/notifications/[action].js
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

const DEFAULT_VAPID_PUBLIC = 'BBa7ExBSDM7jqmWZaOqIdsspJn9IWm2lh0BmPkFjo6EI59Kieci3WrgGJwFYWWDkQS6AAaSnNaGWxRPgPAtDWiE'

const subscriptionSchema = z.object({
  endpoint: z.string().url('Endpoint tidak valid.'),
  keys: z.object({
    p256dh: z.string().min(1, 'Key p256dh wajib ada.'),
    auth: z.string().min(1, 'Key auth wajib ada.'),
  }),
})

async function handler(req, res) {
  const { action } = req.query

  // GET /api/notifications/vapid-public-key
  if (action === 'vapid-public-key') {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])
    const publicKey = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC
    return ok(res, { publicKey })
  }

  // POST / DELETE /api/notifications/subscribe
  if (action === 'subscribe') {
    const payload = await requireAuth(req, res)
    if (!payload) return err(res, 'Tidak terautentikasi.', 401)

    if (req.method === 'POST') {
      const parsed = subscriptionSchema.safeParse(req.body)
      if (!parsed.success) {
        return err(res, parsed.error.errors[0].message)
      }

      const { endpoint, keys } = parsed.data

      // Simpan atau perbarui subscription perangkat
      await sql`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (${payload.sub}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
        ON CONFLICT (endpoint) DO UPDATE
        SET user_id = ${payload.sub}, p256dh = ${keys.p256dh}, auth = ${keys.auth}
      `

      return ok(res, { message: 'Notifikasi berhasil diaktifkan.' }, 201)
    }

    if (req.method === 'DELETE') {
      const endpoint = req.body?.endpoint
      if (endpoint) {
        await sql`
          DELETE FROM push_subscriptions
          WHERE user_id = ${payload.sub} AND endpoint = ${endpoint}
        `
      } else {
        await sql`
          DELETE FROM push_subscriptions
          WHERE user_id = ${payload.sub}
        `
      }
      return ok(res, { message: 'Notifikasi berhasil dinonaktifkan.' })
    }

    return methodNotAllowed(res, ['POST', 'DELETE'])
  }

  return err(res, 'Endpoint tidak ditemukan.', 404)
}

export default withErrorHandler(handler)
