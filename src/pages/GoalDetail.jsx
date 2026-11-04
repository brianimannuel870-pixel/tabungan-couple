// src/pages/GoalDetail.jsx — detail target
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Loader2, TrendingUp } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'
import { formatRupiah, formatTanggal, formatTanggalPendek } from '../lib/format.js'
import ProgressBar from '../components/ProgressBar.jsx'
import GoalFormSheet from '../components/GoalFormSheet.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

function TransactionItem({ deposit }) {
  const isSetor = deposit.type === 'setor'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-sm font-semibold text-slate-600">
        {deposit.userName?.[0]?.toUpperCase() ?? '?'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">
          {deposit.userName ?? 'Pengguna'}
        </p>
        {deposit.note && (
          <p className="text-xs text-slate-400 truncate">{deposit.note}</p>
        )}
        <p className="text-xs text-slate-400">{formatTanggalPendek(deposit.occurredOn)}</p>
      </div>
      <span className={`text-sm font-semibold tabular-nums shrink-0 ${isSetor ? 'text-emerald-600' : 'text-red-500'}`}>
        {isSetor ? '+' : '−'}{formatRupiah(deposit.amount)}
      </span>
    </div>
  )
}

export default function GoalDetail({ onGoalUpdated }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [goal, setGoal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const fetchGoal = useCallback(() => {
    setLoading(true)
    api.get(`/goals/${id}`)
      .then((data) => setGoal(data.goal))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchGoal()
  }, [fetchGoal])

  async function handleUpdate(formData) {
    await api.put(`/goals/${id}`, formData)
    fetchGoal()
    onGoalUpdated?.()
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/goals/${id}`)
      onGoalUpdated?.()
      navigate('/target', { replace: true })
    } catch (e) {
      setError(e.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (error || !goal) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-sm text-red-500 text-center">{error || 'Target tidak ditemukan.'}</p>
        <button onClick={() => navigate('/target')} className="text-sm text-rose-500 font-medium">
          Kembali ke daftar
        </button>
      </div>
    )
  }

  const percent = goal.targetAmount > 0
    ? Math.round((goal.balance / goal.targetAmount) * 100)
    : 0
  const remaining = Math.max(0, goal.targetAmount - goal.balance)

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-md px-4 pt-6">
        {/* Navigasi atas */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/target')}
            className="flex items-center gap-1.5 text-slate-500 active:opacity-70"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Kembali</span>
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 active:scale-[0.95] transition"
              aria-label="Ubah target"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 active:scale-[0.95] transition"
              aria-label="Hapus target"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Header goal */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl" aria-hidden>{goal.icon || '🎯'}</span>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{goal.name}</h1>
              {goal.deadline && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Tenggat: {formatTanggal(goal.deadline)}
                </p>
              )}
            </div>
          </div>

          <div className="mb-3">
            <ProgressBar percent={percent} />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-slate-500">{percent}%</span>
              {goal.isDone && (
                <span className="text-xs font-medium text-emerald-600">🎉 Tercapai!</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-0.5">Terkumpul</p>
              <p className="text-base font-bold text-slate-900 tabular-nums">
                {formatRupiah(goal.balance)}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-0.5">Sisa</p>
              <p className="text-base font-bold text-slate-900 tabular-nums">
                {formatRupiah(remaining)}
              </p>
            </div>
          </div>
        </div>

        {/* Kontribusi */}
        {goal.contributions?.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={16} className="text-rose-500" strokeWidth={1.75} />
              <h2 className="text-base font-medium text-slate-900">Kontribusi</h2>
            </div>
            {goal.contributions.map((c) => (
              <div key={c.userId} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 text-xs font-semibold shrink-0">
                    {c.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-slate-700">
                    {c.name}
                    {c.userId === user?.id && (
                      <span className="ml-1 text-xs text-slate-400">(kamu)</span>
                    )}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(c.amount)}
                  </p>
                  <p className="text-xs text-slate-400">{c.percent}%</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Riwayat */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-base font-medium text-slate-900 mb-1">Riwayat</h2>
          {goal.deposits?.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Belum ada transaksi.</p>
          ) : (
            goal.deposits.map((d) => <TransactionItem key={d.id} deposit={d} />)
          )}
        </div>
      </div>

      {/* Modal edit */}
      {showEdit && (
        <GoalFormSheet
          goal={goal}
          onClose={() => setShowEdit(false)}
          onSave={handleUpdate}
        />
      )}

      {/* Konfirmasi hapus */}
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Hapus Target?"
        message="Semua catatan setoran di target ini akan ikut terhapus. Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, Hapus"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDelete(false)}
      />
    </div>
  )
}

