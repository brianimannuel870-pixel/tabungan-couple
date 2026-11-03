// GET  /api/deposits — riwayat semua deposit couple (filter opsional)
// POST /api/deposits — catat setoran/penarikan baru
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

const createSchema = z.object({
  goalId: z.string().uuid('goalId tidak valid.'),
  type: z.enum(['setor', 'tarik'], { errorMap: () => ({ message: 'Tipe harus "setor" atau "tarik".' }) }),
  amount: z
    .number({ invalid_type_error: 'Nominal harus angka.' })
    .int('Nominal harus bilangan bulat.')
    .positive('Nominal harus lebih dari 0.'),
  note: z.string().max(200, 'Catatan maksimal 200 karakter.').nullable().optional(),
  occurredOn: z.string().optional(), // format YYYY-MM-DD
})

export default async function handler(req, res) {
  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const coupleId = await getCoupleId(payload.sub)
  if (!coupleId) return err(res, 'Kamu belum bergabung di Ruang Couple.', 403)

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { goalId, userId } = req.query

    // Pastikan goalId (jika ada) milik couple ini
    if (goalId) {
      const [g] = await sql`SELECT id FROM goals WHERE id = ${goalId} AND couple_id = ${coupleId} LIMIT 1`
      if (!g) return err(res, 'Target tidak ditemukan.', 404)
    }

    // Pastikan userId (jika ada) adalah anggota couple ini
    if (userId) {
      const [m] = await sql`SELECT user_id FROM couple_members WHERE user_id = ${userId} AND couple_id = ${coupleId} LIMIT 1`
      if (!m) return err(res, 'Pengguna tidak ditemukan di couple ini.', 404)
    }

    const deposits = await sql`
      SELECT
        d.id, d.goal_id, d.type, d.amount, d.note, d.occurred_on, d.created_at,
        d.user_id,
        u.name AS user_name,
        g.name AS goal_name, g.icon AS goal_icon
      FROM deposits d
      JOIN goals g ON g.id = d.goal_id
      LEFT JOIN users u ON u.id = d.user_id
      WHERE g.couple_id = ${coupleId}
        ${goalId ? sql`AND d.goal_id = ${goalId}` : sql``}
        ${userId ? sql`AND d.user_id = ${userId}` : sql``}
      ORDER BY d.occurred_on DESC, d.created_at DESC
      LIMIT 100
    `

    return ok(res, {
      deposits: deposits.map((d) => ({
        id: d.id,
        goalId: d.goal_id,
        goalName: d.goal_name,
        goalIcon: d.goal_icon,
        type: d.type,
        amount: Number(d.amount),
        note: d.note,
        occurredOn: d.occurred_on,
        createdAt: d.created_at,
        userId: d.user_id,
        userName: d.user_name,
      })),
    })
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return err(res, parsed.error.errors[0].message)

    const { goalId, type, amount, note, occurredOn } = parsed.data

    // Pastikan goal milik couple ini
    const [goal] = await sql`
      SELECT id FROM goals WHERE id = ${goalId} AND couple_id = ${coupleId} LIMIT 1
    `
    if (!goal) return err(res, 'Target tidak ditemukan.', 404)

    // Validasi penarikan tidak melebihi saldo
    if (type === 'tarik') {
      const [bal] = await sql`
        SELECT COALESCE(balance, 0) AS balance FROM goal_balances WHERE goal_id = ${goalId}
      `
      const saldo = Number(bal?.balance ?? 0)
      if (amount > saldo) {
        return err(res, `Saldo tidak cukup. Saldo saat ini ${saldo}.`)
      }
    }

    const dateValue = occurredOn ?? new Date().toISOString().split('T')[0]

    const [deposit] = await sql`
      INSERT INTO deposits (goal_id, user_id, type, amount, note, occurred_on)
      VALUES (${goalId}, ${payload.sub}, ${type}, ${amount}, ${note ?? null}, ${dateValue})
      RETURNING id, goal_id, type, amount, note, occurred_on, created_at
    `

    return ok(res, {
      deposit: {
        id: deposit.id,
        goalId: deposit.goal_id,
        type: deposit.type,
        amount: Number(deposit.amount),
        note: deposit.note,
        occurredOn: deposit.occurred_on,
        createdAt: deposit.created_at,
        userId: payload.sub,
      },
    }, 201)
  }

  return methodNotAllowed(res, ['GET', 'POST'])
}

