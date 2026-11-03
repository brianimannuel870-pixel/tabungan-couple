# DATABASE.md

Database: NeonDB (PostgreSQL). Skema sumber: `db/schema.sql`.

## Relasi
```
users 1──n couple_members n──1 couples 1──n goals 1──n deposits
users 1──n deposits (pembuat catatan)
```

## Tabel
| Tabel | Fungsi | Catatan |
|---|---|---|
| `users` | Akun | `email` bertipe `citext` (unik tanpa peduli huruf besar/kecil) |
| `couples` | Ruang couple | `invite_code` unik 6 karakter |
| `couple_members` | Keanggotaan | `user_id` UNIQUE → satu user satu couple; maks. 2 anggota dicek di API |
| `goals` | Target | `target_amount` bigint > 0 |
| `deposits` | Setoran/penarikan | `type` ∈ {`setor`,`tarik`}; `amount` bigint > 0 |

## Aturan
- Nominal = `bigint` rupiah utuh. Neon mengembalikan bigint sebagai string → `Number()` di API.
- Saldo target dihitung (`goal_balances` / `SUM`), **tidak** disimpan sebagai kolom.
- `ON DELETE CASCADE` dari goal ke deposits; user dihapus → `user_id` pada deposits menjadi NULL (riwayat tetap).
- Pembatasan 2 anggota: di API, jalankan dalam satu transaksi `SELECT count(*) ... FOR UPDATE` lalu `INSERT`, untuk mencegah race condition.
- Penarikan tidak boleh membuat saldo negatif: cek saldo + insert dalam satu transaksi.

## Query Penting (pola)
Semua query data **harus dibatasi ke couple milik user**:
```sql
-- Daftar target + saldo untuk couple milik user
SELECT g.*, b.balance
FROM goals g
JOIN goal_balances b ON b.goal_id = g.id
JOIN couple_members m ON m.couple_id = g.couple_id
WHERE m.user_id = $1
ORDER BY g.created_at DESC;

-- Kontribusi per orang pada satu target
SELECT d.user_id, u.name,
       SUM(CASE WHEN d.type='setor' THEN d.amount ELSE -d.amount END)::bigint AS total
FROM deposits d
LEFT JOIN users u ON u.id = d.user_id
WHERE d.goal_id = $2
GROUP BY d.user_id, u.name;
```
(Selalu pastikan `goal_id` milik couple user sebelum mengeksekusi.)

## Pembuatan `invite_code`
6 karakter dari alfabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (tanpa 0/O/1/I). Ulangi jika bentrok (unik).
