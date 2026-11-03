// Script helper: jalankan schema.sql ke Neon
// Usage: node --env-file=.env.local db/migrate.js
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('ERROR: DATABASE_URL tidak ditemukan di environment.')
  process.exit(1)
}

const sql = neon(connectionString)
const schema = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

// Pisahkan per statement, hilangkan komentar tunggal dan baris kosong
function splitStatements(src) {
  const results = []
  let current = ''
  let inSingleQuote = false

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    const next = src[i + 1]

    if (ch === "'" && !inSingleQuote) { inSingleQuote = true; current += ch; continue }
    if (ch === "'" && inSingleQuote) { inSingleQuote = false; current += ch; continue }
    if (!inSingleQuote && ch === '-' && next === '-') {
      // skip rest of line comment
      while (i < src.length && src[i] !== '\n') i++
      continue
    }
    if (!inSingleQuote && ch === ';') {
      const stmt = current.trim()
      if (stmt) results.push(stmt)
      current = ''
      continue
    }
    current += ch
  }
  const last = current.trim()
  if (last) results.push(last)
  return results
}

const statements = splitStatements(schema)

console.log(`Menjalankan schema.sql ke Neon (${statements.length} statements)...`)

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i]
  console.log(`  [${i + 1}/${statements.length}] ${stmt.slice(0, 60).replace(/\s+/g, ' ')}...`)
  try {
    // neon tagged template: sql`...` tidak bisa interpolasi langsung untuk DDL
    // Gunakan arrayMode + fullResults dengan query string langsung
    await sql(stmt)
  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`)
    process.exit(1)
  }
}

console.log('✅ Schema berhasil dijalankan!')


