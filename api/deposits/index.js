// api/deposits/index.js
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

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
  occurredOn: z.string().optional(),
})

async function handler(req, res) {
  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const coupleId = await getCoupleId(payload.sub)
  if (!coupleId) return err(res, 'Kamu belum bergabung di Ruang Couple.', 403)

  if (req.method === 'GET') {
    const { goalId, userId } = req.query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
    const offset = (page - 1) * limit

    let deposits
    let countResult

    if (goalId && userId) {
      countResult = await sql`
        SELECT COUNT(*)::int AS total FROM deposits d
        JOIN goals g ON g.id = d.goal_id
        WHERE g.couple_id = ${coupleId} AND d.goal_id = ${goalId} AND d.user_id = ${userId}
      `
      deposits = await sql`
        SELECT
          d.id, d.goal_id, d.type, d.amount, d.note, d.occurred_on, d.created_at,
          d.user_id, u.name AS user_name, g.name AS goal_name, g.icon AS goal_icon
        FROM deposits d
        JOIN goals g ON g.id = d.goal_id
        LEFT JOIN users u ON u.id = d.user_id
        WHERE g.couple_id = ${coupleId} AND d.goal_id = ${goalId} AND d.user_id = ${userId}
        ORDER BY d.occurred_on DESC, d.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (goalId) {
      countResult = await sql`
        SELECT COUNT(*)::int AS total FROM deposits d
        JOIN goals g ON g.id = d.goal_id
        WHERE g.couple_id = ${coupleId} AND d.goal_id = ${goalId}
      `
      deposits = await sql`
        SELECT
          d.id, d.goal_id, d.type, d.amount, d.note, d.occurred_on, d.created_at,
          d.user_id, u.name AS user_name, g.name AS goal_name, g.icon AS goal_icon
        FROM deposits d
        JOIN goals g ON g.id = d.goal_id
        LEFT JOIN users u ON u.id = d.user_id
        WHERE g.couple_id = ${coupleId} AND d.goal_id = ${goalId}
        ORDER BY d.occurred_on DESC, d.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (userId) {
      countResult = await sql`
        SELECT COUNT(*)::int AS total FROM deposits d
        JOIN goals g ON g.id = d.goal_id
        WHERE g.couple_id = ${coupleId} AND d.user_id = ${userId}
      `
      deposits = await sql`
        SELECT
          d.id, d.goal_id, d.type, d.amount, d.note, d.occurred_on, d.created_at,
          d.user_id, u.name AS user_name, g.name AS goal_name, g.icon AS goal_icon
        FROM deposits d
        JOIN goals g ON g.id = d.goal_id
        LEFT JOIN users u ON u.id = d.user_id
        WHERE g.couple_id = ${coupleId} AND d.user_id = ${userId}
        ORDER BY d.occurred_on DESC, d.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      countResult = await sql`
        SELECT COUNT(*)::int AS total FROM deposits d
        JOIN goals g ON g.id = d.goal_id
        WHERE g.couple_id = ${coupleId}
      `
      deposits = await sql`
        SELECT
          d.id, d.goal_id, d.type, d.amount, d.note, d.occurred_on, d.created_at,
          d.user_id, u.name AS user_name, g.name AS goal_name, g.icon AS goal_icon
        FROM deposits d
        JOIN goals g ON g.id = d.goal_id
        LEFT JOIN users u ON u.id = d.user_id
        WHERE g.couple_id = ${coupleId}
        ORDER BY d.occurred_on DESC, d.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    const total = countResult[0]?.total ?? 0
    const totalPages = Math.ceil(total / limit)

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
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  }

  if (req.method === 'POST') {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return err(res, parsed.error.errors[0].message)

    const { goalId, type, amount, note, occurredOn } = parsed.data

    const [goal] = await sql`
      SELECT id FROM goals WHERE id = ${goalId} AND couple_id = ${coupleId} LIMIT 1
    `
    if (!goal) return err(res, 'Target tidak ditemukan.', 404)

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

export default withErrorHandler(handler)
