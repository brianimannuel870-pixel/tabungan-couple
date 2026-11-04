// POST /api/couple/join — bergabung ke Ruang Couple via kode (atomic insert, max 2 members)
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

const schema = z.object({
  inviteCode: z
    .string()
    .length(6, 'Kode harus 6 karakter.')
    .toUpperCase(),
})

async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const userId = payload.sub

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return err(res, parsed.error.errors[0].message)

  const { inviteCode } = parsed.data

  // Pastikan user belum punya couple
  const myCouple = await sql`
    SELECT couple_id FROM couple_members WHERE user_id = ${userId} LIMIT 1
  `
  if (myCouple.length > 0) {
    return err(res, 'Kamu sudah bergabung di sebuah Ruang Couple.')
  }

  // Cari couple berdasarkan kode
  const [couple] = await sql`
    SELECT id FROM couples WHERE invite_code = ${inviteCode} LIMIT 1
  `
  if (!couple) return err(res, 'Kode tidak valid atau sudah tidak aktif.')

  // Atomic conditional insert: Hanya insert jika jumlah anggota saat ini masih < 2
  // Mencegah race condition tanpa perlu stateful transaction lock
  const inserted = await sql`
    INSERT INTO couple_members (couple_id, user_id)
    SELECT ${couple.id}, ${userId}
    WHERE (
      SELECT COUNT(*)::int FROM couple_members WHERE couple_id = ${couple.id}
    ) < 2
    RETURNING couple_id
  `

  if (inserted.length === 0) {
    return err(res, 'Ruang Couple sudah penuh (maksimal 2 orang).')
  }

  ok(res, { couple: { id: couple.id } })
}

export default withErrorHandler(handler)
