// api/couple/[action].js
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateInviteCode() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

const joinSchema = z.object({
  inviteCode: z
    .string()
    .length(6, 'Kode harus 6 karakter.')
    .toUpperCase(),
})

async function handler(req, res) {
  const { action } = req.query

  // POST /api/couple/create
  if (action === 'create') {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

    const payload = await requireAuth(req, res)
    if (!payload) return err(res, 'Tidak terautentikasi.', 401)

    const userId = payload.sub

    const existing = await sql`
      SELECT couple_id FROM couple_members WHERE user_id = ${userId} LIMIT 1
    `
    if (existing.length > 0) {
      return err(res, 'Kamu sudah bergabung di sebuah Ruang Couple.')
    }

    let inviteCode
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateInviteCode()
      const taken = await sql`SELECT id FROM couples WHERE invite_code = ${candidate} LIMIT 1`
      if (taken.length === 0) {
        inviteCode = candidate
        break
      }
    }
    if (!inviteCode) return err(res, 'Gagal membuat kode. Coba lagi.', 500)

    const [couple] = await sql`
      WITH new_couple AS (
        INSERT INTO couples (invite_code, created_by)
        VALUES (${inviteCode}, ${userId})
        RETURNING id, invite_code
      ), add_member AS (
        INSERT INTO couple_members (couple_id, user_id)
        SELECT id, ${userId} FROM new_couple
      )
      SELECT id, invite_code FROM new_couple
    `

    return ok(res, { couple: { id: couple.id, inviteCode: couple.invite_code } }, 201)
  }

  // POST /api/couple/join
  if (action === 'join') {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

    const payload = await requireAuth(req, res)
    if (!payload) return err(res, 'Tidak terautentikasi.', 401)

    const userId = payload.sub

    const parsed = joinSchema.safeParse(req.body)
    if (!parsed.success) return err(res, parsed.error.errors[0].message)

    const { inviteCode } = parsed.data

    const myCouple = await sql`
      SELECT couple_id FROM couple_members WHERE user_id = ${userId} LIMIT 1
    `
    if (myCouple.length > 0) {
      return err(res, 'Kamu sudah bergabung di sebuah Ruang Couple.')
    }

    const [couple] = await sql`
      SELECT id FROM couples WHERE invite_code = ${inviteCode} LIMIT 1
    `
    if (!couple) return err(res, 'Kode tidak valid atau sudah tidak aktif.')

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

    return ok(res, { couple: { id: couple.id } })
  }

  return err(res, 'Endpoint tidak ditemukan.', 404)
}

export default withErrorHandler(handler)
