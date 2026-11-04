// POST /api/auth/login
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { signToken, setSessionCookie } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

const schema = z.object({
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})

async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return err(res, 'Email atau password salah.', 401)
  }

  const { email, password } = parsed.data

  const [user] = await sql`
    SELECT u.id, u.name, u.email, u.password_hash, cm.couple_id
    FROM users u
    LEFT JOIN couple_members cm ON cm.user_id = u.id
    WHERE u.email = ${email}
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

  ok(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      coupleId: user.couple_id ?? null,
    },
  })
}

export default withErrorHandler(handler)
