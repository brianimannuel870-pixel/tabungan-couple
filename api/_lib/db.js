// api/_lib/db.js — Koneksi NeonDB
import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL tidak ditemukan di environment.')
}

export const sql = neon(process.env.DATABASE_URL)

