-- Tabungan Couple — skema NeonDB (PostgreSQL)
-- Jalankan di Neon SQL Editor. Perubahan berikutnya ditambahkan sebagai migrasi di bawah.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text   NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  email         citext NOT NULL UNIQUE,
  password_hash text   NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS couples (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code text NOT NULL UNIQUE CHECK (char_length(invite_code) = 6),
  created_by  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Satu user hanya boleh di satu couple (UNIQUE user_id).
-- Batas maksimal 2 anggota per couple ditegakkan di API (dalam transaksi).
CREATE TABLE IF NOT EXISTS couple_members (
  couple_id uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (couple_id, user_id)
);

CREATE TABLE IF NOT EXISTS goals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     uuid NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  name          text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  target_amount bigint NOT NULL CHECK (target_amount > 0),
  deadline      date,
  icon          text,
  created_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deposits (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id    uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  type       text NOT NULL CHECK (type IN ('setor', 'tarik')),
  amount     bigint NOT NULL CHECK (amount > 0),
  note       text CHECK (char_length(note) <= 200),
  occurred_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goals_couple     ON goals(couple_id);
CREATE INDEX IF NOT EXISTS idx_deposits_goal    ON deposits(goal_id, occurred_on DESC);
CREATE INDEX IF NOT EXISTS idx_deposits_user    ON deposits(user_id);

-- View bantu: saldo per target (setor − tarik)
CREATE OR REPLACE VIEW goal_balances AS
SELECT
  g.id AS goal_id,
  COALESCE(SUM(CASE WHEN d.type = 'setor' THEN d.amount ELSE -d.amount END), 0)::bigint AS balance
FROM goals g
LEFT JOIN deposits d ON d.goal_id = g.id
GROUP BY g.id;

-- ===== MIGRASI =====
-- 2026-11-04: Tabel push_subscriptions untuk Web Push Notifications pengingat streak
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
