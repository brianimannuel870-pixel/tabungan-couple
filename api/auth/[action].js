// api/auth/[action].js
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { sql } from '../_lib/db.js'
import { signToken, setSessionCookie, clearSessionCookie, requireAuth } from '../_lib/auth.js'
import { ok, err, methodNotAllowed, withErrorHandler } from '../_lib/http.js'

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(1, 'Password wajib diisi.'),
})

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter.').max(60, 'Nama maksimal 60 karakter.'),
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(8, 'Password minimal 8 karakter.'),
})

async function handler(req, res) {
  const { action } = req.query

  // POST /api/auth/login
  if (action === 'login') {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

    const parsed = loginSchema.safeParse(req.body)
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

    const dummyHash = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345'
    const match = await bcrypt.compare(password, user?.password_hash ?? dummyHash)

    if (!user || !match) {
      return err(res, 'Email atau password salah.', 401)
    }

    const token = await signToken({ sub: user.id, name: user.name })
    setSessionCookie(res, token)

    return ok(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        coupleId: user.couple_id ?? null,
      },
    })
  }

  // POST /api/auth/register
  if (action === 'register') {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return err(res, parsed.error.errors[0].message)
    }

    const { name, email, password } = parsed.data

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

    return ok(res, { user: { id: user.id, name: user.name, email: user.email, coupleId: null } }, 201)
  }

  // POST /api/auth/logout
  if (action === 'logout') {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])
    clearSessionCookie(res)
    return ok(res, { message: 'Berhasil keluar.' })
  }

  // GET /api/auth/me
  if (action === 'me') {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

    const payload = await requireAuth(req, res)
    if (!payload) return err(res, 'Tidak terautentikasi.', 401)

    const [user] = await sql`
      SELECT u.id, u.name, u.email,
             cm.couple_id
      FROM users u
      LEFT JOIN couple_members cm ON cm.user_id = u.id
      WHERE u.id = ${payload.sub}
      LIMIT 1
    `

    if (!user) return err(res, 'Pengguna tidak ditemukan.', 404)

    return ok(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        coupleId: user.couple_id ?? null,
      },
    })
  }

  return err(res, 'Endpoint tidak ditemukan.', 404)
}

export default withErrorHandler(handler)
