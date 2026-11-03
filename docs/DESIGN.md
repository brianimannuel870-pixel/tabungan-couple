# DESIGN.md — Panduan Desain

Prinsip: **minimalis, clean, modern, mobile-first, ramah Safari iOS.**

## 1. Palet (Tailwind)
| Peran | Kelas |
|---|---|
| Latar halaman | `bg-slate-50` |
| Permukaan (kartu) | `bg-white` |
| Border halus | `border-slate-200` |
| Teks utama | `text-slate-900` |
| Teks sekunder | `text-slate-500` |
| **Aksen (satu saja)** | `rose-500` (hover `rose-600`, lembut `rose-50`) |
| Sukses | `emerald-500` |
| Bahaya | `red-500` |

Hanya **satu warna aksen**. Jangan menambah gradasi mencolok atau banyak warna.

## 2. Tipografi
- Font: **Plus Jakarta Sans** (fallback `Inter, system-ui, sans-serif`).
- Angka nominal: besar, `font-bold`, `tabular-nums`.
- Skala: judul halaman `text-xl font-semibold`, subjudul `text-base font-medium`, badan `text-sm`, keterangan `text-xs text-slate-500`.
- **Input selalu `text-base` (16px)** agar Safari iOS tidak auto-zoom.

## 3. Bentuk & Spasi
- Kartu: `rounded-2xl bg-white border border-slate-200 p-4` (bayangan sangat tipis `shadow-sm` opsional).
- Tombol & input: `rounded-xl`, tinggi minimal `h-12`.
- Jarak antar elemen kelipatan 4 (`gap-3`, `gap-4`, `p-4`, `p-6`).
- Banyak ruang kosong; satu aksi utama per layar.

## 4. Layout
- Kontainer: `mx-auto w-full max-w-md px-4` (mobile); di desktop tetap terpusat dan rapi.
- Tinggi layar: `min-h-[100dvh]`.
- Konten ditambah `pb-24` agar tidak tertutup bottom nav.
- **Bottom nav:** `fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-slate-200` dengan `pb-[env(safe-area-inset-bottom)]`; 4 item (ikon + label kecil), item aktif berwarna aksen.
- **FAB "Setor":** bulat/pill, warna aksen, ikon `Plus`, posisi di atas bottom nav.
- Modal form di mobile berupa **bottom sheet** (`rounded-t-3xl`), di desktop modal tengah.

## 5. Ikon (lucide-react)
| Kebutuhan | Ikon |
|---|---|
| Logo/tabungan | `PiggyBank` |
| Pasangan | `Heart`, `Users` |
| Target | `Target` |
| Beranda | `Home` |
| Riwayat | `History` |
| Profil | `User` |
| Tambah | `Plus` |
| Setor / tarik | `ArrowDownToLine` / `ArrowUpFromLine` |
| Progres | `TrendingUp` |
| Salin kode | `Copy`, `Check` |
| Keluar | `LogOut` |
| Hapus | `Trash2` |

Ukuran standar `size={20}` (nav `22`). `strokeWidth` 1.75–2.

## 6. Komponen Inti
- **GoalCard:** emoji/ikon, nama, `Rp saldo / Rp target`, `ProgressBar`, persentase.
- **ProgressBar:** track `bg-slate-100`, isi `bg-rose-500`, `rounded-full h-2`, animasi `transition-all`.
- **TransactionItem:** avatar inisial pembuat, nama target, catatan, nominal (`+` hijau setor, `−` merah tarik), tanggal.
- **InputField:** label di atas, error di bawah (`text-xs text-red-500`), `appearance-none`.
- **Button:** primary (aksen), secondary (outline), destructive; state `disabled` & loading (spinner `Loader2` + `animate-spin`).
- **EmptyState:** ikon besar abu, teks singkat, tombol aksi.
- **Toast/feedback** ringan untuk sukses/gagal.

## 7. Interaksi
- Transisi halus 150–200ms (`transition`), tanpa animasi berlebihan.
- Tombol memberi feedback `active:scale-[0.98]`.
- Hormati `prefers-reduced-motion`.
- Selalu tampilkan state **loading (skeleton/spinner)**, **error**, **kosong**.

## 8. Kompatibilitas Safari iOS
Lihat checklist wajib di `AGENTS.md` §8. Tambahan praktis:
```css
html, body { -webkit-text-size-adjust: 100%; }
input, select, textarea, button { font-size: 16px; -webkit-appearance: none; appearance: none; border-radius: 0.75rem; }
.sheet, .scroll-area { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
```
- Hindari `position: sticky` di dalam kontainer ber-`overflow` tanpa pengujian.
- Uji tanggal: `<input type="date">` di iOS tampil native; pastikan lebar & tinggi konsisten (`min-h-12`).
- Uji pada Safari iOS nyata atau simulator, bukan hanya Chrome DevTools.

## 9. Teks (Tone)
Bahasa Indonesia santai-sopan, singkat. Contoh: "Belum ada target. Yuk buat target pertama kalian!", "Email atau password salah."
