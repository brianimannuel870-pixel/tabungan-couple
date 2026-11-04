// src/pages/Riwayat.jsx — riwayat transaksi dengan filter + pagination (10 per halaman)
import { useState, useEffect, useCallback } from 'react'
import { Loader2, History, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { formatRupiah, formatTanggalPendek } from '../lib/format.js'

function DepositItem({ deposit, currentUserId, onDelete }) {
  const isSetor = deposit.type === 'setor'
  const isMine = deposit.userId === currentUserId
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/deposits/${deposit.id}`)
      onDelete(deposit.id)
    } catch (e) {
      alert(e.message)
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-sm font-semibold text-slate-600">
        {deposit.userName?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-slate-900 truncate">
            {deposit.userName ?? 'Pengguna'}
          </span>
          {deposit.goalIcon && (
            <span className="text-xs" aria-hidden>{deposit.goalIcon}</span>
          )}
          <span className="text-xs text-slate-400 truncate">{deposit.goalName}</span>
        </div>
        {deposit.note && (
          <p className="text-xs text-slate-400 truncate">{deposit.note}</p>
        )}
        <p className="text-xs text-slate-400">{formatTanggalPendek(deposit.occurredOn)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-semibold tabular-nums ${isSetor ? 'text-emerald-600' : 'text-red-500'}`}>
          {isSetor ? '+' : '−'}{formatRupiah(deposit.amount)}
        </span>
        {isMine && !confirming && (
          <button
            onClick={() => setConfirming(true)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition"
            aria-label="Hapus catatan"
          >
            <Trash2 size={14} />
          </button>
        )}
        {isMine && confirming && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 font-medium px-2 py-1 rounded-lg bg-red-50 active:scale-95 transition"
          >
            {deleting ? '…' : 'Hapus?'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Riwayat() {
  const { user } = useAuth()
  const [deposits, setDeposits] = useState([])
  const [goals, setGoals] = useState([])
  const [members, setMembers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filter & Page
  const [filterGoal, setFilterGoal] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [page, setPage] = useState(1)

  // Load goals & members sekali di awal
  useEffect(() => {
    Promise.all([api.get('/goals'), api.get('/couple')])
      .then(([gData, cData]) => {
        setGoals(gData.goals ?? [])
        setMembers(cData.couple.members ?? [])
      })
      .catch((e) => setError(e.message))
  }, [])

  // Load deposits setiap filter atau page berubah
  const loadDeposits = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (filterGoal) params.append('goalId', filterGoal)
      if (filterUser) params.append('userId', filterUser)

      const data = await api.get(`/deposits?${params.toString()}`)
      setDeposits(data.deposits ?? [])
      if (data.pagination) setPagination(data.pagination)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, filterGoal, filterUser])

  useEffect(() => {
    loadDeposits()
  }, [loadDeposits])

  function handleFilterGoalChange(e) {
    setFilterGoal(e.target.value)
    setPage(1) // reset ke halaman 1 saat filter berubah
  }

  function handleFilterUserChange(e) {
    setFilterUser(e.target.value)
    setPage(1) // reset ke halaman 1 saat filter berubah
  }

  function handleDelete(id) {
    const nextList = deposits.filter((d) => d.id !== id)
    setDeposits(nextList)
    // Jika halaman jadi kosong dan bukan halaman 1, mundur 1 halaman
    if (nextList.length === 0 && page > 1) {
      setPage((p) => p - 1)
    } else {
      loadDeposits()
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-28">
      <div className="mx-auto w-full max-w-md px-4 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-slate-900">Riwayat</h1>
          {pagination.total > 0 && (
            <span className="text-xs text-slate-400">
              Total {pagination.total} transaksi
            </span>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-4">
          <select
            value={filterGoal}
            onChange={handleFilterGoalChange}
            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Semua target</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.icon ? `${g.icon} ` : ''}{g.name}
              </option>
            ))}
          </select>
          <select
            value={filterUser}
            onChange={handleFilterUserChange}
            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">Semua orang</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-500 text-center py-16">{error}</p>
        ) : deposits.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <History size={40} className="text-slate-300" strokeWidth={1.5} />
            <p className="text-slate-500 text-sm text-center">
              {filterGoal || filterUser
                ? 'Tidak ada transaksi untuk filter ini.'
                : 'Belum ada transaksi. Yuk mulai menabung!'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 mb-4">
              {deposits.map((d) => (
                <DepositItem
                  key={d.id}
                  deposit={d}
                  currentUserId={user?.id}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 flex items-center gap-1 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} /> Sebelumnya
                </button>

                <span className="text-xs text-slate-500 font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasNext}
                  className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 flex items-center gap-1 active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
