# API.md — Kontrak Endpoint

Base: `/api`. Format: JSON. Auth: cookie httpOnly `session` (JWT).
Error standar: `{ "error": "Pesan bahasa Indonesia" }` dengan status HTTP yang sesuai.
Kecuali dinyatakan **Publik**, semua endpoint butuh login (401 jika tidak). Endpoint data juga butuh keanggotaan couple (403 jika belum).

## Auth
| Method & Path | Body | Respons sukses | Error |
|---|---|---|---|
| `POST /auth/register` (Publik) | `{ name, email, password }` | 201 `{ user: {id,name,email} }` + set cookie | 400 data tidak valid, 409 email terdaftar |
| `POST /auth/login` (Publik) | `{ email, password }` | 200 `{ user }` + set cookie | 401 "Email atau password salah" |
| `POST /auth/logout` | — | 200 `{ ok: true }` + hapus cookie | — |
| `GET /auth/me` | — | 200 `{ user, couple: null \| { id, invite_code, members: [{id,name}] } }` | 401 |

## Couple
| Method & Path | Body | Respons | Error |
|---|---|---|---|
| `POST /couple/create` | — | 201 `{ couple }` | 409 sudah punya couple |
| `POST /couple/join` | `{ invite_code }` | 200 `{ couple }` | 404 kode tidak ditemukan, 409 couple penuh / sudah punya couple |
| `GET /couple` | — | 200 `{ couple }` | 403 belum punya couple |

## Goals
| Method & Path | Body / Query | Respons |
|---|---|---|
| `GET /goals` | — | 200 `{ goals: [{ id, name, target_amount, deadline, icon, balance, is_done }] }` |
| `POST /goals` | `{ name, target_amount, deadline?, icon? }` | 201 `{ goal }` |
| `GET /goals/:id` | — | 200 `{ goal, balance, contributions: [{user_id,name,total}], deposits: [...] }` |
| `PATCH /goals/:id` | field yang diubah | 200 `{ goal }` |
| `DELETE /goals/:id` | — | 200 `{ ok: true }` |

`is_done` dihitung: `balance >= target_amount`.

## Deposits
| Method & Path | Body / Query | Respons |
|---|---|---|
| `GET /deposits` | `?goalId=&userId=&page=1&limit=10` | 200 `{ deposits: [...], pagination: { page, limit, total, totalPages, hasNext, hasPrev } }` |
| `POST /deposits` | `{ goal_id, type, amount, note?, occurred_on? }` | 201 `{ deposit }`; 400 jika penarikan melebihi saldo |
| `DELETE /deposits/:id` | — | 200 `{ ok: true }`; 403 jika bukan pembuat |

## Aturan Lintas-Endpoint
- `couple_id` **tidak pernah** diterima dari client; diturunkan dari `couple_members` berdasarkan user login.
- `amount` bilangan bulat > 0. Semua body divalidasi `zod`.
- Semua `bigint` dikonversi ke `Number` sebelum dikirim.
- Metode HTTP tidak didukung → 405.
