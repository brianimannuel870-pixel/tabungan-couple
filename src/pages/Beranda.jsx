// src/pages/Beranda.jsx — total tabungan, kalender mingguan, progress bar kontribusi, ringkasan target, 10 aktivitas
import { Link } from 'react-router-dom'
import { PiggyBank, ChevronRight, RefreshCw } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useData } from '../context/DataContext.jsx'
import { formatRupiah, formatTanggalPendek } from '../lib/format.js'
import ProgressBar from '../components/ProgressBar.jsx'
import DailySavingsCard from '../components/DailySavingsCard.jsx'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
      <div className="flex gap-3 mb-3">
        <div className="w-8 h-8 bg-slate-100 rounded-xl" />
        <div className="flex-1">
          <div className="h-4 bg-slate-100 rounded w-3/4 mb-1.5" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full" />
    </div>
  )
}

export default function Beranda() {
  const { user } = useAuth()
  const { goals, couple, recentDeposits, calendarDeposits, isDataLoaded, isSyncing, refreshAllData, error } = useData()

  const members = couple?.members ?? []
  const deposits = recentDeposits ?? []
  const loading = !isDataLoaded

  const totalTabungan = goals.reduce((s, g) => s + g.balance, 0)

  // Hitung kontribusi total kedua anggota
  const member1 = members[0]
  const member2 = members[1]
  const c1 = member1?.totalContributed ?? 0
  const c2 = member2?.totalContributed ?? 0
  const totalBoth = c1 + c2

  const p1 = totalBoth > 0 ? Math.round((c1 / totalBoth) * 100) : 0
  const p2 = totalBoth > 0 ? 100 - p1 : 0

  const topGoals = [...goals]
    .sort((a, b) => {
      if (a.isDone !== b.isDone) return a.isDone ? 1 : -1
      if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline)
      if (a.deadline) return -1
      if (b.deadline) return 1
      return 0
    })
    .slice(0, 3)

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-28">
      <div className="mx-auto w-full max-w-md px-4 pt-8">

        {/* Greeting + Tombol Sinkronisasi / Refresh */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800 truncate">Hei, {user?.name}!</p>
            <p className="text-xs text-slate-400">Yuk cek tabungan kalian hari ini.</p>
          </div>
          
          {/* Tombol Refresh / Sinkronisasi */}
          <button
            type="button"
            onClick={() => refreshAllData()}
            disabled={isSyncing}
            className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-rose-500 hover:border-rose-200 active:scale-[0.95] transition flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-60"
            title="Tarik data terbaru dari pasangan"
            aria-label="Sinkronisasi data"
          >
            <RefreshCw size={15} className={`text-rose-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="text-xs font-semibold">{isSyncing ? 'Sinkron…' : 'Sinkron'}</span>
          </button>
        </div>

        {/* Total tabungan + Kontribusi terintegrasi */}
        <div className="bg-rose-500 rounded-2xl p-5 mb-5 text-white shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-sm opacity-80 mb-1">Total Tabungan</p>
            {loading ? (
              <div className="h-9 bg-white/20 rounded-xl animate-pulse w-48" />
            ) : (
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {formatRupiah(totalTabungan)}
              </p>
            )}
            <p className="text-xs opacity-75 mt-1">
              {goals.length} target aktif
            </p>
          </div>

          {/* Bar Kontribusi di bagian bawah kartu */}
          <div className="pt-3 border-t border-white/20 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs opacity-80">
              <span className="font-medium">Kontribusi Bersama</span>
            </div>

            {/* Progress Bar Dwi-Warna (Putih vs Putih Transparan) */}
            <div className="w-full h-2 bg-black/15 rounded-full overflow-hidden flex">
              <div
                className="bg-white h-full transition-all duration-500"
                style={{ width: `${p1}%` }}
                title={`${member1?.name ?? 'Anggota 1'}: ${p1}%`}
              />
              <div
                className="bg-white/40 h-full transition-all duration-500"
                style={{ width: `${p2}%` }}
                title={`${member2?.name ?? 'Anggota 2'}: ${p2}%`}
              />
            </div>

            {/* Nama masing-masing */}
            <div className="flex items-center justify-between text-[11px] opacity-90 pt-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                <span className="truncate font-medium">
                  {member1 ? (member1.id === user?.id ? `${member1.name} (kamu)` : member1.name) : 'Menunggu pasangan'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0 justify-end text-right">
                <span className="truncate font-medium">
                  {member2 ? (member2.id === user?.id ? `${member2.name} (kamu)` : member2.name) : '—'}
                </span>
                <span className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Kalender Tabungan Harian (Weekly Strip Carousel) dengan data lengkap calendarDeposits */}
        {!loading && (
          <DailySavingsCard
            deposits={calendarDeposits?.length > 0 ? calendarDeposits : deposits}
            members={members}
            currentUserId={user?.id}
          />
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 text-center mb-4">{error}</p>
        )}

        {/* Target teratas */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-medium text-slate-900">Target</h2>
            <Link to="/target" className="text-xs text-rose-500 font-medium flex items-center gap-0.5">
              Lihat semua <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : topGoals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-500 mb-3">Belum ada target. Yuk buat target pertama kalian!</p>
              <Link
                to="/target"
                className="inline-block h-9 px-4 rounded-xl bg-rose-500 text-white text-sm font-medium leading-9"
              >
                Buat Target
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {topGoals.map((g) => {
                const percent = g.targetAmount > 0
                  ? Math.round((g.balance / g.targetAmount) * 100)
                  : 0
                return (
                  <Link
                    key={g.id}
                    to={`/target/${g.id}`}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 active:scale-[0.99] transition"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl" aria-hidden>{g.icon || '🎯'}</span>
                      <span className="font-medium text-slate-900 truncate flex-1">{g.name}</span>
                      {g.isDone && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                          Selesai
                        </span>
                      )}
                    </div>
                    <ProgressBar percent={percent} />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs text-slate-500 tabular-nums">{formatRupiah(g.balance)}</span>
                      <span className="text-xs text-slate-400">{percent}%</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* 10 Aktivitas terbaru */}
        {deposits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-medium text-slate-900">Aktivitas Terbaru</h2>
              <Link to="/riwayat" className="text-xs text-rose-500 font-medium flex items-center gap-0.5">
                Lihat semua <ChevronRight size={14} />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4">
              {deposits.map((d) => {
                const isSetor = d.type === 'setor'
                return (
                  <div key={d.id} className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-600">
                      {d.userName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 truncate">
                        <span className="font-medium">{d.userName}</span>
                        {' · '}
                        <span className="text-slate-500">{d.goalName}</span>
                      </p>
                      <p className="text-xs text-slate-400">{formatTanggalPendek(d.occurredOn)}</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums shrink-0 ${isSetor ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isSetor ? '+' : '−'}{formatRupiah(d.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
