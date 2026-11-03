# AGENTS.md — Aturan untuk Agent Coding

Dokumen ini adalah **sumber kebenaran aturan kerja** untuk agent (Claude Code, Cursor, Copilot, dll.) di proyek **Tabungan Couple**.
Baca file ini + `PRD.md` sebelum menulis kode. Detail lanjutan ada di `docs/`.

## 1. Ringkasan Proyek
Aplikasi web tabungan bersama untuk dua orang (pasangan): target bareng, setoran tercatat, progres terlihat.
Detail produk: `PRD.md`. Daftar tugas: `docs/TASKS.md`.

## 2. Tech Stack (JANGAN diganti tanpa persetujuan)
| Lapisan | Pilihan |
|---|---|
| Frontend | React + Vite (JavaScript, bukan TypeScript) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Ikon | `lucide-react` (satu-satunya library ikon) |
| Routing | `react-router-dom` |
| Backend | Vercel Serverless Functions di folder `/api` |
| Database | NeonDB (PostgreSQL) via `@neondatabase/serverless` |
| Auth | Email+password, `bcryptjs`, JWT (`jose`) di cookie httpOnly |
| Validasi | `zod` (di API) |

Dilarang menambah dependency baru tanpa alasan jelas. Jika perlu, jelaskan alasannya di pesan/PR.

## 3. Perintah
```bash
npm install
npx vercel dev        # jalankan frontend + /api (gunakan ini, bukan hanya `vite`)
npm run build         # build produksi
npm run lint          # jika tersedia
```
Env var (`.env.local`, jangan di-commit): `DATABASE_URL`, `JWT_SECRET`.

## 4. Struktur Folder
```
/api
  /_lib        db.js, auth.js, http.js (helper; awalan _ = bukan endpoint)
  /auth        register.js, login.js, logout.js, me.js
  /couple      create.js, join.js, index.js
  /goals       index.js, [id].js
  /deposits    index.js, [id].js
/src
  /components  komponen UI reusable
  /pages       Login, Register, Home, Goals, GoalDetail, History, Profile, Pairing
  /hooks       useAuth, useGoals, dst.
  /lib         api.js (wrapper fetch), format.js (Rupiah, tanggal)
/db            schema.sql
/docs          DESIGN.md, DATABASE.md, API.md, TASKS.md
```

## 5. Aturan Kode
- **Bahasa:** teks UI & pesan error untuk pengguna dalam **Bahasa Indonesia**. Nama variabel, fungsi, file, kolom DB dalam **bahasa Inggris**.
- Komponen React: fungsional + hooks. Satu komponen per file, nama file `PascalCase.jsx`. Hook diawali `use`.
- Jaga komponen kecil (idealnya < 150 baris). Pecah jika membesar.
- Gunakan `async/await`, hindari `.then()` berantai.
- Setiap pemanggilan API dari frontend lewat `src/lib/api.js`, jangan `fetch` langsung di komponen.
- Setiap halaman/aksi yang memuat data harus punya **state loading, error, dan empty**.
- Tidak ada `console.log` tersisa, tidak ada kode mati/komentar kode lama.
- Jangan membuat abstraksi berlebihan. Selesaikan kebutuhan sekarang dulu (MVP).

## 6. Aturan Uang (KRITIS)
- Nominal disimpan sebagai **`bigint` rupiah utuh** (tanpa desimal). **Dilarang** `float`/`numeric` desimal.
- Driver Neon mengembalikan `bigint` sebagai **string** → konversi dengan `Number()` di API sebelum dikirim ke client (nilai tabungan wajar aman di bawah 2^53).
- Format tampilan lewat `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })` di `src/lib/format.js`. Jangan format manual.
- Saldo target = `SUM(setor) − SUM(tarik)` dihitung di query, **jangan** disimpan sebagai kolom terpisah.
- Validasi di server: `amount` bilangan bulat > 0. Penarikan tidak boleh membuat saldo target negatif.

## 7. Aturan Keamanan (WAJIB)
1. **Frontend tidak pernah terhubung langsung ke Neon.** Semua akses DB lewat `/api`.
2. Password di-hash `bcryptjs` (cost 10+). Jangan pernah log/return `password_hash`.
3. Sesi: JWT di **cookie httpOnly**, `sameSite=lax`, `secure` di produksi. **Dilarang** menyimpan token di `localStorage`/`sessionStorage`.
4. **Otorisasi di setiap endpoint data:** ambil `userId` dari cookie, cari `couple_id` milik user dari `couple_members`. **Jangan percaya `couple_id` dari body/query client.** Setiap query goals/deposits harus dibatasi ke couple milik user.
5. Query SQL hanya via tagged template `sql\`...\`` (parameterized). Dilarang menyusun SQL dengan string concat.
6. Validasi semua input dengan `zod`. Kembalikan error yang aman (jangan bocorkan detail internal).
7. Pesan login gagal harus generik: "Email atau password salah".
8. Jangan commit secret. `.env*` ada di `.gitignore`.

## 8. Aturan UI/UX (ringkas — detail di `docs/DESIGN.md`)
- Gaya: **minimalis, clean, modern**, banyak ruang kosong, satu warna aksen.
- **Mobile-first**, layout utama `max-w-md mx-auto` di mobile, melebar rapi di desktop.
- Navigasi utama: bottom navigation (Beranda, Target, Riwayat, Profil).
- Ikon hanya dari `lucide-react`. Jangan pakai emoji sebagai ikon UI (emoji hanya untuk ikon target buatan user).
- **Wajib kompatibel Safari iOS** — lihat checklist di bawah.

### Checklist Safari iOS (cek setiap kali membuat/ubah UI)
- [ ] Tinggi layar penuh pakai `min-h-[100dvh]`, **bukan** `100vh`
- [ ] Meta viewport memuat `viewport-fit=cover`
- [ ] Bottom nav & elemen fixed bawah memakai `pb-[env(safe-area-inset-bottom)]`
- [ ] Semua `input/select/textarea` punya `font-size` **≥ 16px** (cegah auto-zoom)
- [ ] Input/tombol memakai `appearance-none` + `rounded-*` eksplisit
- [ ] Tap target minimal 44×44px
- [ ] Tidak memakai fitur CSS/JS yang belum didukung Safari iOS 15+ tanpa fallback
- [ ] Tidak bergantung pada `localStorage` untuk sesi (cookie httpOnly saja)
- [ ] Scroll modal/bottom sheet tidak "bocor" ke body (`overscroll-behavior: contain`)

## 9. Cara Kerja Agent
1. Baca `PRD.md`, lalu `docs/TASKS.md`. Kerjakan **satu tugas per waktu**, sesuai urutan.
2. Jika ada ambiguitas pada requirement, **tanya dulu**, jangan berasumsi pada hal yang menyentuh uang, auth, atau skema DB.
3. Perubahan skema DB harus lewat `db/schema.sql` (tambahkan migrasi, jangan ubah tabel diam-diam) dan perbarui `docs/DATABASE.md`.
4. Perubahan endpoint harus memperbarui `docs/API.md`.
5. Setelah selesai satu tugas: centang di `docs/TASKS.md`, ringkas apa yang diubah dan cara mengetesnya.
6. Jangan mengubah file di luar cakupan tugas.

## 10. Definition of Done
- Berfungsi di mobile (lebar 375px) dan desktop.
- Sudah diuji logika Safari iOS sesuai checklist.
- State loading/error/empty tersedia.
- Tidak ada pelanggaran aturan keamanan (bagian 7).
- Tidak ada error di console/build.
- Dokumen terkait (`API.md`, `DATABASE.md`, `TASKS.md`) sudah diperbarui.
