// src/pages/Beranda.jsx — total tabungan, ringkasan target, 5 aktivitas terbaru
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PiggyBank, ChevronRight, Loader2 } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { formatRupiah, formatTanggalPendek } from '../lib/format.js'
import ProgressBar from '../components/ProgressBar.jsx'

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
  const [goals, setGoals] = useState([])
  const [deposits, setDeposits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [gData, dData] = await Promise.all([
          api.get('/goals'),
          api.get('/deposits'),
        ])
        setGoals(gData.goals)
        setDeposits(dData.deposits.slice(0, 5))
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalTabungan = goals.reduce((s, g) => s + g.balance, 0)

  // 3 target: belum selesai diutamakan, lalu terdekat tenggat
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

        {/* Greeting */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-semibold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-slate-500">Hei, {user?.name}!</p>
            <p className="text-xs text-slate-400">Yuk cek tabungan kalian hari ini.</p>
          </div>
          <PiggyBank size={24} className="ml-auto text-rose-400" strokeWidth={1.75} />
        </div>

        {/* Total tabungan */}
        <div className="bg-rose-500 rounded-2xl p-5 mb-5 text-white">
          <p className="text-sm opacity-80 mb-1">Total Tabungan</p>
          {loading
            ? <div className="h-9 bg-white/20 rounded-xl animate-pulse w-48" />
            : (
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {formatRupiah(totalTabungan)}
              </p>
            )
          }
          <p className="text-xs opacity-70 mt-1">
            {goals.length} target aktif
          </p>
        </div>

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

        {/* 5 Aktivitas terbaru */}
        {!loading && deposits.length > 0 && (
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
