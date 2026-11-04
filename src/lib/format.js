// src/lib/format.js — Format Rupiah & tanggal
const currencyFmt = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const dateShortFmt = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatRupiah(amount) {
  return currencyFmt.format(Number(amount))
}

// Konversi YYYY-MM-DD ke Date lokal agar tidak terjadi offset UTC
// new Date('2026-11-04') = UTC midnight → di WIB tampil "3 Nov 2026" (salah)
// new Date(2026, 10, 4)  = lokal midnight → di WIB tampil "4 Nov 2026" (benar)
function parseDateLocal(dateStr) {
  if (!dateStr) return null
  // Tanggal dari DB bisa berupa Date object atau string YYYY-MM-DD
  if (dateStr instanceof Date) return dateStr
  const [y, m, d] = String(dateStr).split('T')[0].split('-')
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  const date = parseDateLocal(dateStr)
  if (!date) return '-'
  return dateFmt.format(date)
}

export function formatTanggalPendek(dateStr) {
  if (!dateStr) return '-'
  const date = parseDateLocal(dateStr)
  if (!date) return '-'
  return dateShortFmt.format(date)
}
