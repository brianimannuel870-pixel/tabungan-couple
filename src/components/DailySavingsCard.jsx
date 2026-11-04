// src/components/DailySavingsCard.jsx — Kalender Tabungan Harian (Weekly Strip Carousel)
import { useMemo } from 'react'
import { Flame, Check, Sparkles } from 'lucide-react'
import { formatRupiah } from '../lib/format.js'

function getLocalDateString(d) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Normalisasi string tanggal dari DB / API ke format YYYY-MM-DD
function normalizeDateStr(dateVal) {
  if (!dateVal) return ''
  if (typeof dateVal === 'string') {
    return dateVal.split('T')[0]
  }
  if (dateVal instanceof Date) {
    return getLocalDateString(dateVal)
  }
  return String(dateVal).slice(0, 10)
}

export default function DailySavingsCard({ deposits = [], members = [], currentUserId }) {
  const todayStr = useMemo(() => getLocalDateString(new Date()), [])

  // Susun 7 hari minggu berjalan (Senin s/d Minggu)
  const weekDays = useMemo(() => {
    const now = new Date()
    const currentDay = now.getDay() // 0 = Minggu, 1 = Senin, ...
    // Jarak dari hari Senin (jika Minggu/0, jarak = -6)
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay

    const monday = new Date(now)
    monday.setDate(now.getDate() + distanceToMonday)

    const days = []
    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = getLocalDateString(d)
      days.push({
        date: d,
        dateStr,
        dayNum: d.getDate(),
        dayName: dayNames[i],
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
      })
    }
    return days
  }, [todayStr])

  // Normalisasi semua setoran agar tanggal terstandarisasi YYYY-MM-DD
  const normalizedSetorDeposits = useMemo(() => {
    return deposits
      .filter((dep) => dep.type === 'setor')
      .map((dep) => ({
        ...dep,
        normalizedDate: normalizeDateStr(dep.occurredOn),
      }))
  }, [deposits])

  // Hitung setoran per hari & user
  const dayStats = useMemo(() => {
    const map = {}
    weekDays.forEach((w) => {
      map[w.dateStr] = {
        total: 0,
        user1Contributed: false,
        user2Contributed: false,
        user1Amount: 0,
        user2Amount: 0,
      }
    })

    const member1 = members[0]
    const member2 = members[1]

    normalizedSetorDeposits.forEach((dep) => {
      const dateKey = dep.normalizedDate
      if (map[dateKey]) {
        map[dateKey].total += dep.amount
        if (member1 && dep.userId === member1.id) {
          map[dateKey].user1Contributed = true
          map[dateKey].user1Amount += dep.amount
        } else if (member2 && dep.userId === member2.id) {
          map[dateKey].user2Contributed = true
          map[dateKey].user2Amount += dep.amount
        }
      }
    })

    return map
  }, [weekDays, normalizedSetorDeposits, members])

  // Hitung streak komitmen bersama (HANYA bertambah jika KEDUA pasangan menabung di hari yang sama)
  const currentStreak = useMemo(() => {
    const member1 = members[0]
    const member2 = members[1]

    // Jika belum punya pasangan atau belum ada 2 anggota, streak bersama belum aktif
    if (!member1 || !member2) return 0

    let streak = 0
    const today = new Date()

    // Periksa ke belakang maksimal 30 hari
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const str = getLocalDateString(d)

      // Cek apakah di tanggal ini KEDUA member menabung
      const user1Saved = normalizedSetorDeposits.some(
        (dep) => dep.normalizedDate === str && dep.userId === member1.id
      )
      const user2Saved = normalizedSetorDeposits.some(
        (dep) => dep.normalizedDate === str && dep.userId === member2.id
      )
      const bothSaved = user1Saved && user2Saved

      if (bothSaved) {
        streak++
      } else {
        // Jika hari ini belum lengkap keduanya menabung, jangan langsung gugurkan streak kemarin
        if (i === 0) continue
        break
      }
    }
    return streak
  }, [normalizedSetorDeposits, members])

  const member1 = members[0]
  const member2 = members[1]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5">
      {/* Header Card */}
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
          currentStreak > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-400'
        }`}>
          <Flame size={18} className={currentStreak > 0 ? 'fill-amber-500' : ''} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Judul + Indikator Anggota 1 & Anggota 2 bersebelahan di baris atas */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 leading-tight truncate">
              Tabungan Minggu Ini
            </h3>

            {/* Indikator Anggota 1 & 2 di kanan teks */}
            <div className="flex items-center gap-2 shrink-0">
              {member1 && (
                <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium" title={member1.name}>
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="max-w-[48px] truncate">{member1.id === currentUserId ? 'Kamu' : member1.name}</span>
                </span>
              )}
              {member2 && (
                <span className="flex items-center gap-1 text-[10px] text-slate-600 font-medium" title={member2.name}>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                  <span className="max-w-[48px] truncate">{member2.id === currentUserId ? 'Kamu' : member2.name}</span>
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-0.5">
            {currentStreak > 0 ? (
              <span className="text-amber-600 font-medium">🔥 {currentStreak} hari streak kompak</span>
            ) : (
              'Nabung bareng tiap hari untuk nyalakan streak!'
            )}
          </p>
        </div>
      </div>

      {/* 7-Day Strip Carousel Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((day) => {
          const stats = dayStats[day.dateStr] || { total: 0, user1Contributed: false, user2Contributed: false }
          const bothContributed = stats.user1Contributed && stats.user2Contributed
          const eitherContributed = stats.user1Contributed || stats.user2Contributed

          return (
            <div
              key={day.dateStr}
              className={`flex flex-col items-center justify-between py-2 px-1 rounded-xl transition relative ${
                day.isToday
                  ? 'bg-rose-50/70 border-2 border-rose-500'
                  : bothContributed
                  ? 'bg-rose-50/40 border border-rose-200'
                  : eitherContributed
                  ? 'bg-slate-50 border border-slate-200'
                  : day.isFuture
                  ? 'bg-transparent border border-slate-100 opacity-40'
                  : 'bg-slate-50/60 border border-slate-100'
              }`}
            >
              {/* Nama Hari */}
              <span className={`text-[10px] font-medium leading-none ${day.isToday ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                {day.dayName}
              </span>

              {/* Tanggal Angka */}
              <span className={`text-sm font-semibold tabular-nums my-1 leading-none ${day.isToday ? 'text-rose-600' : 'text-slate-800'}`}>
                {day.dayNum}
              </span>

              {/* Titik / Avatar Indikator Kontribusi */}
              <div className="h-3 flex items-center justify-center gap-1">
                {bothContributed ? (
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white flex items-center justify-center" title="Keduanya menabung!">
                    <Check size={9} strokeWidth={3} />
                  </div>
                ) : (
                  <>
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition ${
                        stats.user1Contributed ? 'bg-rose-500 scale-110' : 'bg-slate-200'
                      }`}
                      title={member1 ? `${member1.name}: ${stats.user1Contributed ? 'Sudah setor' : 'Belum'}` : ''}
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full transition ${
                        stats.user2Contributed ? 'bg-indigo-500 scale-110' : 'bg-slate-200'
                      }`}
                      title={member2 ? `${member2.name}: ${stats.user2Contributed ? 'Sudah setor' : 'Belum'}` : ''}
                    />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Ringkasan status hari ini */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500 flex items-center gap-1">
          <Sparkles size={13} className="text-rose-500" />
          Hari ini:
        </span>
        <span className="font-medium text-slate-700 tabular-nums">
          {dayStats[todayStr]?.total > 0 ? (
            <span className="text-emerald-600 font-semibold">
              Terisi {formatRupiah(dayStats[todayStr].total)}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">Belum ada setoran</span>
          )}
        </span>
      </div>
    </div>
  )
}
