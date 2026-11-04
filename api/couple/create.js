// POST /api/couple/create — buat Ruang Couple baru
import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

// Karakter aman: tanpa 0/O/1/I yang membingungkan
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateInviteCode() {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const payload = await requireAuth(req, res)
  if (!payload) return err(res, 'Tidak terautentikasi.', 401)

  const userId = payload.sub

  // Pastikan user belum punya couple
  const existing = await sql`
    SELECT couple_id FROM couple_members WHERE user_id = ${userId} LIMIT 1
  `
  if (existing.length > 0) {
    return err(res, 'Kamu sudah bergabung di sebuah Ruang Couple.')
  }

  // Generate kode unik (retry jika tabrakan)
  let inviteCode
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateInviteCode()
    const taken = await sql`SELECT id FROM couples WHERE invite_code = ${candidate} LIMIT 1`
    if (taken.length === 0) { inviteCode = candidate; break }
  }
  if (!inviteCode) return err(res, 'Gagal membuat kode. Coba lagi.', 500)

  // Buat couple + tambahkan pembuat sebagai anggota dalam satu CTE atomik
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

  ok(res, { couple: { id: couple.id, inviteCode: couple.invite_code } }, 201)
}

export default withErrorHandler(handler)
