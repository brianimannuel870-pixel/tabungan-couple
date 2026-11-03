// api/_lib/db.js — Koneksi NeonDB via HTTP (stateless, cocok untuk serverless)
import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL tidak ditemukan. Pastikan env var sudah di-set di Vercel dashboard.',
  )
}

// Strip channel_binding karena tidak didukung di HTTP mode Neon
const cleanUrl = connectionString.replace(/[&?]channel_binding=[^&]*/g, '')

export const sql = neon(cleanUrl)
