// GET /api/couple — info couple + kedua anggota + total kontribusi
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const userId = payload.sub

  const [membership] = await sql`
    SELECT couple_id FROM couple_members WHERE user_id = ${userId} LIMIT 1
  `
  if (!membership) return err(res, 'Kamu belum bergabung di Ruang Couple.', 404)

  const coupleId = membership.couple_id

  const [couple] = await sql`
    SELECT id, invite_code, created_at FROM couples WHERE id = ${coupleId}
  `

  // Hitung total kontribusi bersih per anggota across all goals
  const members = await sql`
    SELECT
      u.id, u.name, u.email, cm.joined_at,
      COALESCE(
        SUM(CASE WHEN d.type = 'setor' THEN d.amount ELSE -d.amount END),
        0
      )::bigint AS total_contributed
    FROM couple_members cm
    JOIN users u ON u.id = cm.user_id
    LEFT JOIN deposits d ON d.user_id = u.id
      AND d.goal_id IN (SELECT id FROM goals WHERE couple_id = ${coupleId})
    WHERE cm.couple_id = ${coupleId}
    GROUP BY u.id, u.name, u.email, cm.joined_at
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
        totalContributed: Math.max(0, Number(m.total_contributed)),
      })),
    },
  })
}

export default withErrorHandler(handler)
