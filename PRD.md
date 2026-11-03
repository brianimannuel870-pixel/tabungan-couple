# PRD — Tabungan Couple

**Versi:** 1.0 (MVP) **Status:** Draft siap dikerjakan

## 1. Latar Belakang & Tujuan
Pasangan sering menabung bersama (nikah, liburan, rumah, dana darurat) tetapi pencatatannya tersebar di chat atau catatan terpisah. Tabungan Couple menyediakan satu ruang sederhana agar kedua pasangan bisa melihat target, setoran, dan progres secara transparan.

**Tujuan MVP**
- Dua orang dapat terhubung dalam satu "Ruang Couple".
- Membuat target tabungan bersama dan mencatat setoran/penarikan.
- Melihat progres dan kontribusi masing-masing dengan jelas.

**Di luar cakupan MVP (non-goals):** integrasi bank/e-wallet, pembayaran nyata, notifikasi push, multi-couple per user, mata uang selain IDR, aplikasi native.

## 2. Pengguna
- **Pasangan (2 orang)** yang ingin menabung bersama. Pengguna awam, dominan memakai **HP (termasuk iPhone/Safari)**.
- Bahasa: Indonesia.

## 3. Prinsip Produk
1. **Sederhana:** tiap layar punya satu tujuan jelas.
2. **Transparan:** kedua pihak melihat data yang sama.
3. **Cepat:** mencatat setoran maksimal 3 ketuk dari beranda.
4. **Aman:** data keuangan hanya terlihat oleh anggota couple.

## 4. Alur Utama
1. **Daftar** → otomatis login.
2. **Pairing:** pengguna membuat Ruang Couple (mendapat kode undangan 6 karakter) **atau** memasukkan kode dari pasangan.
3. Setelah 2 anggota bergabung → akses penuh ke Beranda.
4. Buat **Target** → catat **Setoran** → pantau **Progres**.

## 5. Kebutuhan Fungsional (User Stories)

### 5.1 Autentikasi
| ID | Sebagai | Saya ingin | Kriteria Penerimaan |
|---|---|---|---|
| A1 | Pengguna baru | mendaftar dengan nama, email, password | Email unik (case-insensitive); password min. 8 karakter; error jelas dalam bahasa Indonesia; sukses → login otomatis |
| A2 | Pengguna | login dengan email & password | Pesan gagal generik; sesi 30 hari via cookie httpOnly |
| A3 | Pengguna | logout | Cookie dihapus, kembali ke halaman login |
| A4 | Pengguna | tetap login saat membuka ulang aplikasi | Saat app dibuka memanggil `/api/auth/me`; tampil loading lalu redirect sesuai status |
| A5 | Pengguna belum login | dialihkan ke login saat membuka halaman terproteksi | Semua halaman selain Login/Daftar terproteksi |

### 5.2 Pairing Couple
| ID | Saya ingin | Kriteria Penerimaan |
|---|---|---|
| C1 | membuat Ruang Couple | Menghasilkan `invite_code` unik 6 karakter (huruf kapital & angka tanpa karakter membingungkan 0/O/1/I); user langsung menjadi anggota |
| C2 | bergabung via kode | Kode valid; couple belum penuh (maks. 2); user belum punya couple; sukses → masuk couple |
| C3 | menyalin/membagikan kode | Tombol salin (ikon `Copy`) + umpan balik "Tersalin" |
| C4 | melihat nama pasangan | Profil menampilkan kedua anggota |

Aturan: satu user hanya boleh berada di **satu** couple.

### 5.3 Target Tabungan
| ID | Saya ingin | Kriteria Penerimaan |
|---|---|---|
| G1 | membuat target | Field: nama (wajib), nominal target (wajib, > 0), tenggat (opsional), ikon emoji (opsional) |
| G2 | melihat daftar target | Kartu dengan nama, saldo/target, progress bar, persentase |
| G3 | melihat detail target | Saldo, sisa, tenggat, kontribusi tiap orang (nominal & %), riwayat setoran target tsb |
| G4 | mengubah/menghapus target | Hapus meminta konfirmasi; menghapus target menghapus setorannya |
| G5 | menandai target selesai | Otomatis `is_done` saat saldo ≥ target (boleh dibuka lagi) |

### 5.4 Setoran & Penarikan
| ID | Saya ingin | Kriteria Penerimaan |
|---|---|---|
| D1 | mencatat setoran | Pilih target, nominal (> 0), tanggal (default hari ini), catatan opsional; tercatat atas nama user yang login |
| D2 | mencatat penarikan | Tidak boleh melebihi saldo target |
| D3 | melihat riwayat | Urut terbaru; filter per orang dan per target; tampil siapa, berapa, kapan |
| D4 | menghapus/mengoreksi catatan sendiri | Hanya pembuat catatan; saldo dihitung ulang |

### 5.5 Beranda
- Total tabungan seluruh target (angka besar).
- Ringkasan 3 target teratas / terdekat tenggat.
- 5 aktivitas terbaru.
- Tombol aksi utama **"+ Setor"**.

## 6. Kebutuhan Non-Fungsional
- **Responsif:** mobile-first; diuji di lebar 360–430px dan desktop.
- **Safari iOS:** wajib berjalan baik (lihat `AGENTS.md` §8 dan `docs/DESIGN.md`).
- **Performa:** halaman utama interaktif < 2 detik di jaringan 4G.
- **Keamanan:** lihat `AGENTS.md` §7. Otorisasi berbasis keanggotaan couple di setiap endpoint.
- **Aksesibilitas:** kontras teks memadai, label pada input, tap target ≥ 44px.
- **Bahasa & format:** UI Indonesia; mata uang `Rp` format `id-ID`; tanggal format Indonesia.

## 7. Model Data (ringkas)
`users`, `couples`, `couple_members`, `goals`, `deposits`. Skema lengkap: `db/schema.sql`, penjelasan: `docs/DATABASE.md`.

## 8. API (ringkas)
Kontrak lengkap di `docs/API.md`. Kelompok: `/api/auth/*`, `/api/couple/*`, `/api/goals/*`, `/api/deposits/*`.

## 9. Halaman & Navigasi
| Rute | Halaman | Akses |
|---|---|---|
| `/login` | Login | Publik |
| `/daftar` | Daftar | Publik |
| `/pairing` | Buat/gabung couple | Login, belum punya couple |
| `/` | Beranda | Login + couple |
| `/target` | Daftar target | Login + couple |
| `/target/:id` | Detail target | Login + couple |
| `/riwayat` | Riwayat transaksi | Login + couple |
| `/profil` | Profil & kode undangan | Login + couple |

Bottom navigation: Beranda · Target · Riwayat · Profil. Setor via FAB / modal bottom sheet.

## 10. Keputusan Terbuka
| # | Pertanyaan | Default MVP |
|---|---|---|
| 1 | Perlu konfirmasi pasangan atas tiap setoran? | **Tidak.** Pencatatan manual langsung sah. Bisa jadi fitur tahap 2 |
| 2 | Boleh pasangan menghapus catatan pasangannya? | **Tidak.** Hanya pembuat catatan |
| 3 | Bagaimana jika salah satu keluar dari couple? | Di luar MVP |

## 11. Metrik Keberhasilan
- Pasangan menyelesaikan pairing < 2 menit setelah daftar.
- Waktu mencatat setoran < 15 detik.
- Tidak ada kebocoran data antar couple (uji otorisasi lulus).

## 12. Rilis Setelah MVP (Tahap 2)
Penarikan lanjutan & kategori, pengingat setoran rutin, milestone 25/50/75/100%, estimasi tercapai, export CSV/PDF, mode gelap, tema warna, konfirmasi setoran oleh pasangan.
