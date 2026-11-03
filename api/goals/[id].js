// GET  /api/goals/:id — detail goal + kontribusi + riwayat
// PUT  /api/goals/:id — update goal
// DELETE /api/goals/:id — hapus goal (cascade deposits)
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed } from '../_lib/http.js'

async function getCoupleId(userId) {
  const [row] = await sql`
    SELECT couple_id FROM couple_members WHERE user_id = ${userId} LIMIT 1
  `
  return row?.couple_id ?? null
}

const updateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  targetAmount: z.number().int().positive().optional(),
  deadline: z.string().nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
})

export default async function handler(req, res) {
  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const coupleId = await getCoupleId(payload.sub)
  if (!coupleId) return err(res, 'Kamu belum bergabung di Ruang Couple.', 403)

  // Vercel menaruh param di req.query
  const { id } = req.query
  if (!id) return err(res, 'ID goal diperlukan.', 400)

  // Pastikan goal milik couple ini
  const [goal] = await sql`
    SELECT id, name, target_amount, deadline, icon, created_at
    FROM goals
    WHERE id = ${id} AND couple_id = ${coupleId}
    LIMIT 1
  `
  if (!goal) return err(res, 'Target tidak ditemukan.', 404)

  if (req.method === 'GET') {
    const [balRow] = await sql`
      SELECT COALESCE(balance, 0) AS balance FROM goal_balances WHERE goal_id = ${id}
    `
    const balance = Number(balRow?.balance ?? 0)

    // Kontribusi per anggota
    const contribs = await sql`
      SELECT
        u.id AS user_id, u.name,
        COALESCE(SUM(CASE WHEN d.type = 'setor' THEN d.amount ELSE -d.amount END), 0)::bigint AS net
      FROM couple_members cm
      JOIN users u ON u.id = cm.user_id
      LEFT JOIN deposits d ON d.goal_id = ${id} AND d.user_id = u.id
      WHERE cm.couple_id = ${coupleId}
      GROUP BY u.id, u.name
    `

    // Riwayat setoran
    const deposits = await sql`
      SELECT
        d.id, d.type, d.amount, d.note, d.occurred_on, d.created_at,
        u.id AS user_id, u.name AS user_name
      FROM deposits d
      LEFT JOIN users u ON u.id = d.user_id
      WHERE d.goal_id = ${id}
      ORDER BY d.occurred_on DESC, d.created_at DESC
      LIMIT 50
    `

    return ok(res, {
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.target_amount),
        balance,
        deadline: goal.deadline,
        icon: goal.icon,
        createdAt: goal.created_at,
        isDone: balance >= Number(goal.target_amount),
        contributions: contribs.map((c) => ({
          userId: c.user_id,
          name: c.name,
          amount: Number(c.net),
          percent: balance > 0 ? Math.round((Number(c.net) / balance) * 100) : 0,
        })),
        deposits: deposits.map((d) => ({
          id: d.id,
          type: d.type,
          amount: Number(d.amount),
          note: d.note,
          occurredOn: d.occurred_on,
          createdAt: d.created_at,
          userId: d.user_id,
          userName: d.user_name,
        })),
      },
    })
  }

  if (req.method === 'PUT') {
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return err(res, parsed.error.errors[0].message)

    const { name, targetAmount, deadline, icon } = parsed.data

    const [updated] = await sql`
      UPDATE goals SET
        name         = COALESCE(${name ?? null}, name),
        target_amount = COALESCE(${targetAmount ?? null}, target_amount),
        deadline     = ${deadline !== undefined ? (deadline ?? null) : goal.deadline},
        icon         = ${icon !== undefined ? (icon ?? null) : goal.icon}
      WHERE id = ${id} AND couple_id = ${coupleId}
      RETURNING id, name, target_amount, deadline, icon, created_at
    `
    return ok(res, {
      goal: {
        id: updated.id,
        name: updated.name,
        targetAmount: Number(updated.target_amount),
        deadline: updated.deadline,
        icon: updated.icon,
      },
    })
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM goals WHERE id = ${id} AND couple_id = ${coupleId}`
    return ok(res, { message: 'Target berhasil dihapus.' })
  }

  return methodNotAllowed(res, ['GET', 'PUT', 'DELETE'])
}

