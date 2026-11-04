// api/_lib/auth.js — JWT & cookie helper
import { SignJWT, jwtVerify } from 'jose'

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not defined!')
}

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE_NAME = 'tc_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 hari

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, SECRET)
  return payload
}

export function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookie = [
    `${COOKIE_NAME}=${token}`,
    `Max-Age=${MAX_AGE}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    isProd ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ')

  res.setHeader('Set-Cookie', cookie)
}

export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`,
  )
}

export function parseCookies(req) {
  const raw = req.headers.cookie ?? ''
  return Object.fromEntries(
    raw.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=')
      return [k, v.join('=')]
    }),
  )
}

export async function requireAuth(req, res) {
  const cookies = parseCookies(req)
  const token = cookies[COOKIE_NAME]
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}
