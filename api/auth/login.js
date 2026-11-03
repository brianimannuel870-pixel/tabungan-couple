// POST /api/auth/login
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { signToken, setSessionCookie } from '../_lib/auth.js'
import { ok, err, methodNotAllowed } from '../_lib/http.js'

const schema = z.object({
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    // Pesan generik agar tidak bocorkan info
    return err(res, 'Email atau password salah.', 401)
  }

  const { email, password } = parsed.data

  const [user] = await sql`
    SELECT id, name, email, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1
  `

  // Waktu konstan agar tidak bocorkan keberadaan email via timing
  const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345'
  const match = await bcrypt.compare(password, user?.password_hash ?? dummyHash)

  if (!user || !match) {
    return err(res, 'Email atau password salah.', 401)
  }

  const token = await signToken({ sub: user.id, name: user.name })
  setSessionCookie(res, token)

  ok(res, { user: { id: user.id, name: user.name, email: user.email } })
}

