// POST /api/auth/register
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { signToken, setSessionCookie } from '../_lib/auth.js'
import { ok, err, methodNotAllowed } from '../_lib/http.js'

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter.').max(60, 'Nama maksimal 60 karakter.'),
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(8, 'Password minimal 8 karakter.'),
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return err(res, parsed.error.errors[0].message)
  }

  const { name, email, password } = parsed.data

  // Cek email sudah terdaftar (citext → case-insensitive otomatis)
  const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`
  if (existing.length > 0) {
    return err(res, 'Email sudah terdaftar.')
  }

  const password_hash = await bcrypt.hash(password, 10)

  const [user] = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${password_hash})
    RETURNING id, name, email, created_at
  `

  const token = await signToken({ sub: user.id, name: user.name })
  setSessionCookie(res, token)

  ok(res, { user: { id: user.id, name: user.name, email: user.email } }, 201)
}

