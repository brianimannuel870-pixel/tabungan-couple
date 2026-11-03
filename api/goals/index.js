// GET /api/goals — daftar target couple + saldo
// POST /api/goals — buat target baru
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
  name: z.string().min(1, 'Nama target wajib diisi.').max(80, 'Nama maksimal 80 karakter.'),
  targetAmount: z
    .number({ invalid_type_error: 'Nominal harus angka.' })
    .int('Nominal harus bilangan bulat.')
    .positive('Nominal harus lebih dari 0.'),
  deadline: z.string().nullable().optional(),
  icon: z.string().max(10).nullable().optional(),
})

export default async function handler(req, res) {
  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const coupleId = await getCoupleId(payload.sub)
  if (!coupleId) return err(res, 'Kamu belum bergabung di Ruang Couple.', 403)

  if (req.method === 'GET') {
    const goals = await sql`
      SELECT
        g.id, g.name, g.target_amount, g.deadline, g.icon, g.created_at,
        COALESCE(gb.balance, 0) AS balance
      FROM goals g
      LEFT JOIN goal_balances gb ON gb.goal_id = g.id
      WHERE g.couple_id = ${coupleId}
      ORDER BY g.created_at DESC
    `
    return ok(res, {
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        targetAmount: Number(g.target_amount),
        balance: Number(g.balance),
        deadline: g.deadline,
        icon: g.icon,
        createdAt: g.created_at,
        isDone: Number(g.balance) >= Number(g.target_amount),
      })),
    })
  }

  if (req.method === 'POST') {
    const parsed = createSchema.safeParse(req.body)
    if (!parsed.success) return err(res, parsed.error.errors[0].message)

    const { name, targetAmount, deadline, icon } = parsed.data

    const [goal] = await sql`
      INSERT INTO goals (couple_id, name, target_amount, deadline, icon, created_by)
      VALUES (
        ${coupleId}, ${name}, ${targetAmount},
        ${deadline ?? null}, ${icon ?? null}, ${payload.sub}
      )
      RETURNING id, name, target_amount, deadline, icon, created_at
    `
    return ok(res, {
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.target_amount),
        balance: 0,
        deadline: goal.deadline,
        icon: goal.icon,
        createdAt: goal.created_at,
        isDone: false,
      },
    }, 201)
  }

  return methodNotAllowed(res, ['GET', 'POST'])
}

