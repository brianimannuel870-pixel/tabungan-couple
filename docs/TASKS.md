# TASKS.md — Daftar Tugas MVP

Kerjakan berurutan, satu tugas per waktu. Centang `[x]` setelah selesai dan memenuhi Definition of Done (`AGENTS.md` §10).

## Fase 0 — Fondasi
- [x] 0.1 Inisialisasi Vite React, Tailwind v4, `react-router-dom`, `lucide-react`
- [x] 0.2 Pasang dependency API: `@neondatabase/serverless bcryptjs jose cookie zod`
- [x] 0.3 Buat `vercel.json` (rewrite SPA, kecuali `/api`), `.gitignore` (`.env*`), `.env.example`
- [x] 0.4 Meta viewport `viewport-fit=cover`, font Plus Jakarta Sans, CSS dasar Safari (lihat `docs/DESIGN.md` §8)
- [x] 0.5 Jalankan `db/schema.sql` di Neon

## Fase 1 — Backend Auth
- [x] 1.1 `api/_lib/db.js`, `auth.js`, `http.js` (helper respons/error)
- [x] 1.2 `POST /auth/register`
- [x] 1.3 `POST /auth/login`
- [x] 1.4 `POST /auth/logout`
- [x] 1.5 `GET /auth/me`

## Fase 2 — Frontend Auth
- [x] 2.1 `src/lib/api.js` (wrapper fetch, `credentials: 'same-origin'`, penanganan error)
- [x] 2.2 `useAuth` (state user, loading, login, register, logout)
- [x] 2.3 Halaman `Login` & `Daftar` (clean, mobile-first, validasi, Safari-safe)
- [x] 2.4 Route guard (publik vs terproteksi vs butuh couple)

## Fase 3 — Pairing
- [x] 3.1 API `couple/create`, `couple/join`, `couple` (dengan transaksi & batas 2 anggota)
- [x] 3.2 Halaman `Pairing` (buat / masukkan kode)
- [x] 3.3 Tampilan kode undangan + tombol salin di Profil

## Fase 4 — Target
- [x] 4.1 API goals (list, create, detail, update, delete)
- [x] 4.2 Halaman Daftar Target + `GoalCard` + `ProgressBar`
- [x] 4.3 Form buat/ubah target (bottom sheet)
- [x] 4.4 Halaman Detail Target (saldo, kontribusi, riwayat)

## Fase 5 — Setoran
- [x] 5.1 API deposits (list, create dengan validasi saldo, delete oleh pembuat)
- [x] 5.2 Modal "Setor/Tarik" + FAB
- [x] 5.3 Halaman Riwayat dengan filter orang & target

## Fase 6 — Beranda & Poles
- [x] 6.1 Beranda: total, ringkasan target, aktivitas terbaru
- [x] 6.2 Bottom navigation + safe-area iOS
- [x] 6.3 Skeleton loading, empty state, toast
- [x] 6.4 Uji menyeluruh Safari iOS & lebar 360–430px (checklist Safari selesai, format tanggal lokal aman)
- [x] 6.5 Uji otorisasi & race condition: atomic couple/join, user couple A tidak bisa akses couple B
- [x] 6.6 Deploy Vercel + set env var live di GitHub

## Backlog Tahap 2
Milestone & animasi, pengingat setoran rutin, estimasi tercapai, export CSV/PDF, mode gelap, tema warna, konfirmasi setoran pasangan.
