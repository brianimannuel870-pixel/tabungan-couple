// GET /api/couple — info couple + kedua anggota
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed } from '../_lib/http.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const userId = payload.sub

  // Ambil couple_id milik user (otorisasi berbasis keanggotaan)
  const [membership] = await sql`
    SELECT couple_id FROM couple_members WHERE user_id = ${userId} LIMIT 1
  `
  if (!membership) return err(res, 'Kamu belum bergabung di Ruang Couple.', 404)

  const coupleId = membership.couple_id

  const [couple] = await sql`
    SELECT id, invite_code, created_at FROM couples WHERE id = ${coupleId}
  `

  const members = await sql`
    SELECT u.id, u.name, u.email, cm.joined_at
    FROM couple_members cm
    JOIN users u ON u.id = cm.user_id
    WHERE cm.couple_id = ${coupleId}
    ORDER BY cm.joined_at ASC
  `

  ok(res, {
    couple: {
      id: couple.id,
      inviteCode: couple.invite_code,
      createdAt: couple.created_at,
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        joinedAt: m.joined_at,
      })),
    },
  })
}

