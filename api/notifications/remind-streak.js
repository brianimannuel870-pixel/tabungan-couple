// api/notifications/remind-streak.js
import webpush from 'web-push'
import { sql } from '../_lib/db.js'
import { ok, err, withErrorHandler } from '../_lib/http.js'

const DEFAULT_VAPID_PUBLIC = 'BBa7ExBSDM7jqmWZaOqIdsspJn9IWm2lh0BmPkFjo6EI59Kieci3WrgGJwFYWWDkQS6AAaSnNaGWxRPgPAtDWiE'
const DEFAULT_VAPID_PRIVATE = '-Nyeny-U6_XtirFXfv5G17PyMi91UNxQ1nwjyR5ZpYA'

const publicKey = process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC
const privateKey = process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE

webpush.setVapidDetails(
  'mailto:support@tabungancouple.app',
  publicKey,
  privateKey
)

async function handler(req, res) {
  // Verifikasi otorisasi Cron atau admin via CRON_SECRET (jika tersedia di Vercel)
  const authHeader = req.headers['authorization']
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return err(res, 'Tidak diizinkan.', 401)
  }

  const todayStr = new Date().toISOString().split('T')[0]

  // Cari semua couple yang memiliki 2 anggota
  const couples = await sql`
    SELECT c.id AS couple_id, array_agg(cm.user_id) AS members
    FROM couples c
    JOIN couple_members cm ON cm.couple_id = c.id
    GROUP BY c.id
    HAVING count(cm.user_id) = 2
  `

  let notifiedCount = 0

  for (const couple of couples) {
    const [user1Id, user2Id] = couple.members

    // Cek siapa yang sudah setor hari ini
    const todayDeposits = await sql`
      SELECT DISTINCT d.user_id, u.name
      FROM deposits d
      JOIN goals g ON g.id = d.goal_id
      JOIN users u ON u.id = d.user_id
      WHERE g.couple_id = ${couple.couple_id}
        AND d.type = 'setor'
        AND d.occurred_on = ${todayStr}
    `

    const depositedUserIds = todayDeposits.map((d) => d.user_id)

    // Jika tepat 1 orang yang sudah setor, ingatkan pasangannya!
    if (depositedUserIds.length === 1) {
      const alreadySavedUserId = depositedUserIds[0]
      const targetUserId = alreadySavedUserId === user1Id ? user2Id : user1Id
      const partnerName = todayDeposits[0].name || 'Pasanganmu'

      // Ambil push subscriptions dari user yang belum setor
      const subs = await sql`
        SELECT endpoint, p256dh, auth
        FROM push_subscriptions
        WHERE user_id = ${targetUserId}
      `

      const payload = JSON.stringify({
        title: '🔥 Jaga Streak Tabungan!',
        body: `${partnerName} sudah menabung hari ini! Yuk setor juga sebelum hari berganti agar streak kalian tetap menyala.`,
        url: '/',
      })

      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          )
          notifiedCount++
        } catch (pushErr) {
          // Hapus subscription basi / expired (status 410 atau 404)
          if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
            await sql`DELETE FROM push_subscriptions WHERE endpoint = ${sub.endpoint}`
          }
        }
      }
    }
  }

  return ok(res, {
    message: `Pengecekan streak selesai. ${notifiedCount} pengingat terkirim.`,
    today: todayStr,
  })
}

export default withErrorHandler(handler)
