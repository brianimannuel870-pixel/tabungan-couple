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

export function formatTanggal(dateStr) {
  if (!dateStr) return '-'
  return dateFmt.format(new Date(dateStr))
}

export function formatTanggalPendek(dateStr) {
  if (!dateStr) return '-'
  return dateShortFmt.format(new Date(dateStr))
}

