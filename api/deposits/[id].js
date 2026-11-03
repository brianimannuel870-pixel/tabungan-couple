// DELETE /api/deposits/:id — hapus catatan (hanya pembuat)
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed } from '../_lib/http.js'

async function getCoupleId(userId) {
  const [row] = await sql`
    SELECT couple_id FROM couple_members WHERE user_id = ${userId} LIMIT 1
  `
  return row?.couple_id ?? null
}

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return methodNotAllowed(res, ['DELETE'])

  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const coupleId = await getCoupleId(payload.sub)
  if (!coupleId) return err(res, 'Kamu belum bergabung di Ruang Couple.', 403)

  const { id } = req.query
  if (!id) return err(res, 'ID deposit diperlukan.', 400)

  // Cek deposit milik user ini dan goalnya milik couple ini
  const [deposit] = await sql`
    SELECT d.id, d.user_id
    FROM deposits d
    JOIN goals g ON g.id = d.goal_id
    WHERE d.id = ${id}
      AND g.couple_id = ${coupleId}
    LIMIT 1
  `
  if (!deposit) return err(res, 'Catatan tidak ditemukan.', 404)
  if (deposit.user_id !== payload.sub) {
    return err(res, 'Kamu hanya bisa menghapus catatan milikmu sendiri.', 403)
  }

  await sql`DELETE FROM deposits WHERE id = ${id}`
  ok(res, { message: 'Catatan berhasil dihapus.' })
}

