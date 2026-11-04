// src/pages/Riwayat.jsx — riwayat transaksi dengan filter + pagination (10 per halaman)
import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, History, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { useData } from '../context/DataContext.jsx'
import { formatRupiah, formatTanggalPendek } from '../lib/format.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

function DepositItem({ deposit, currentUserId, onRequestDelete }) {
  const isSetor = deposit.type === 'setor'
  const isMine = deposit.userId === currentUserId

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
        {isMine && (
          <button
            onClick={() => onRequestDelete(deposit)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition"
            aria-label="Hapus catatan"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Riwayat() {
  const { user } = useAuth()
  const { goals, couple, initialHistory, setInitialHistory, handleDepositSaved } = useData()
  const members = couple?.members ?? []

  // Filter & Page
  const [filterGoal, setFilterGoal] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [page, setPage] = useState(1)

  // Ambil state awal langsung dari prefetch cache jika default (page 1, tanpa filter)
  const isDefaultView = page === 1 && !filterGoal && !filterUser

  const [deposits, setDeposits] = useState(() => (isDefaultView && initialHistory.loaded ? initialHistory.deposits : []))
  const [pagination, setPagination] = useState(() => (isDefaultView && initialHistory.loaded ? initialHistory.pagination : { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false }))
  const [loading, setLoading] = useState(() => !(isDefaultView && initialHistory.loaded))
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Flag untuk mendeteksi render pertama
  const isFirstMount = useRef(true)

  // Sinkronkan state lokal jika cache global ter-update dari luar (misal: habis setor lewat FAB)
  useEffect(() => {
    if (isDefaultView && initialHistory.loaded) {
      setDeposits(initialHistory.deposits)
      setPagination(initialHistory.pagination)
      setLoading(false)
    }
  }, [initialHistory, isDefaultView])

  // Load deposits setiap filter atau page berubah (kecuali render awal yang sudah punya cache)
  const loadDeposits = useCallback(async () => {
    // Jika render awal dan data default sudah ada dari prefetch cache, jangan panggil fetch kedua
    if (isFirstMount.current) {
      isFirstMount.current = false
      if (page === 1 && !filterGoal && !filterUser && initialHistory.loaded) {
        return
      }
    }

    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (filterGoal) params.append('goalId', filterGoal)
      if (filterUser) params.append('userId', filterUser)

      const data = await api.get(`/deposits?${params.toString()}`)
      const fetchedDeposits = data.deposits ?? []
      const fetchedPagination = data.pagination ?? { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false }

      setDeposits(fetchedDeposits)
      setPagination(fetchedPagination)

      // Simpan ke cache jika ini default view
      if (page === 1 && !filterGoal && !filterUser) {
        setInitialHistory({
          deposits: fetchedDeposits,
          pagination: fetchedPagination,
          loaded: true,
        })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, filterGoal, filterUser, initialHistory.loaded, setInitialHistory])

  useEffect(() => {
    loadDeposits()
  }, [loadDeposits])

  function handleFilterGoalChange(e) {
    setFilterGoal(e.target.value)
    setPage(1)
  }

  function handleFilterUserChange(e) {
    setFilterUser(e.target.value)
    setPage(1)
  }

  function handleDelete(id) {
    const nextList = deposits.filter((d) => d.id !== id)
    setDeposits(nextList)
    handleDepositSaved()
    if (nextList.length === 0 && page > 1) {
      setPage((p) => p - 1)
    } else {
      loadDeposits()
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/deposits/${deleteTarget.id}`)
      handleDelete(deleteTarget.id)
      setDeleteTarget(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(false)
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
                  onRequestDelete={(deposit) => setDeleteTarget(deposit)}
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

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Hapus Catatan Transaksi?"
        message={
          deleteTarget
            ? `Hapus transaksi ${deleteTarget.type === 'setor' ? 'setoran' : 'penarikan'} sebesar ${formatRupiah(deleteTarget.amount)}? Saldo target akan otomatis disesuaikan.`
            : ''
        }
        confirmText="Ya, Hapus"
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </div>
  )
}
