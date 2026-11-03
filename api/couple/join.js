// POST /api/couple/join — bergabung ke Ruang Couple via kode
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed } from '../_lib/http.js'

const schema = z.object({
  inviteCode: z
    .string()
    .length(6, 'Kode harus 6 karakter.')
    .toUpperCase(),
})

export default async function handler(req, res) {
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

  // Cek jumlah anggota (max 2) — pakai SELECT FOR UPDATE agar race-condition aman
  const members = await sql`
    SELECT user_id FROM couple_members
    WHERE couple_id = ${couple.id}
    FOR UPDATE
  `
  if (members.length >= 2) {
    return err(res, 'Ruang Couple sudah penuh (maksimal 2 orang).')
  }

  await sql`
    INSERT INTO couple_members (couple_id, user_id)
    VALUES (${couple.id}, ${userId})
  `

  ok(res, { couple: { id: couple.id } })
}

