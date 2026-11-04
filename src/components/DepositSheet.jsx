// src/components/DepositSheet.jsx — modal bottom sheet setor / tarik dengan real-time date picker lokal
import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Calendar } from 'lucide-react'
import { api } from '../lib/api.js'
import { formatRupiah, formatTanggal } from '../lib/format.js'
import ConfirmDialog from './ConfirmDialog.jsx'

// Dapatkan string tanggal lokal YYYY-MM-DD (bukan UTC)
function getTodayLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function DepositSheet({ goals, onClose, onSaved, defaultGoalId }) {
  const todayStr = getTodayLocalDate()
  const [tab, setTab] = useState('setor')
  const [form, setForm] = useState({
    goalId: defaultGoalId ?? goals[0]?.id ?? '',
    amount: '',
    note: '',
    occurredOn: todayStr,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Pastikan tanggal selalu ter-update ke real-time hari ini saat modal terbuka
  useEffect(() => {
    setForm((f) => ({ ...f, occurredOn: getTodayLocalDate() }))
  }, [])

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 200) // durasi animasi keluar
  }, [onClose])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && !loading && !showConfirm) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose, loading, showConfirm])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const amount = parseInt(form.amount.replace(/\D/g, ''), 10)
    if (!form.goalId) return setError('Pilih target tabungan.')
    if (!amount || amount <= 0) return setError('Nominal harus lebih dari 0.')

    setShowConfirm(true)
  }

  async function handleExecuteSubmit() {
    const amount = parseInt(form.amount.replace(/\D/g, ''), 10)
    setLoading(true)
    try {
      const data = await api.post('/deposits', {
        goalId: form.goalId,
        type: tab,
        amount,
        note: form.note.trim() || null,
        occurredOn: form.occurredOn || todayStr,
      })
      setShowConfirm(false)
      try {
        onSaved?.(data.deposit)
      } finally {
        handleClose()
      }
    } catch (e) {
      setError(e.message)
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

  const selectedGoal = goals.find((g) => g.id === form.goalId)
  const isToday = form.occurredOn === todayStr

  return (
    <>
      {/* Overlay Backdrop dengan animasi Fade */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100 animate-fade-in'
        }`}
        onClick={handleClose}
        aria-hidden
      />

      {/* Sheet Modal dengan animasi Slide Up / Down */}
      <div
        className={`sheet fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto transition-transform duration-200 ease-out ${
          isClosing
            ? 'translate-y-full'
            : 'translate-y-0 animate-sheet-up'
        }`}
      >
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Catat Transaksi</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab setor / tarik */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
          {['setor', 'tarik'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 h-10 rounded-lg text-sm font-medium transition capitalize ${
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {t === 'setor' ? '+ Setor' : '− Tarik'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Pilih target */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dep-goal" className="text-sm font-medium text-slate-700">
              Target <span className="text-red-400">*</span>
            </label>
            <select
              id="dep-goal"
              name="goalId"
              required
              value={form.goalId}
              onChange={handleChange}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">Pilih target…</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.icon ? `${g.icon} ` : ''}{g.name}
                </option>
              ))}
            </select>
            {selectedGoal && (
              <p className="text-xs text-slate-500 pl-1">
                Saldo: <span className="font-medium tabular-nums">{formatRupiah(selectedGoal.balance)}</span>
                {' '}/ {formatRupiah(selectedGoal.targetAmount)}
              </p>
            )}
          </div>

          {/* Nominal */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dep-amount" className="text-sm font-medium text-slate-700">
              Nominal <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium pointer-events-none">Rp</span>
              <input
                id="dep-amount"
                name="amount"
                type="text"
                inputMode="numeric"
                required
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/\D/g, '') }))}
                placeholder="0"
                className="h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent w-full tabular-nums"
              />
            </div>
          </div>

          {/* Tanggal (Real-time Date Picker dengan badge status Hari Ini) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="dep-date" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Calendar size={15} className="text-rose-500" />
                Tanggal Transaksi
              </label>
              {isToday ? (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  Hari ini
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, occurredOn: todayStr }))}
                  className="text-[11px] text-rose-500 hover:underline font-medium"
                >
                  Set ke hari ini
                </button>
              )}
            </div>

            <input
              id="dep-date"
              name="occurredOn"
              type="date"
              required
              value={form.occurredOn}
              onChange={handleChange}
              max={todayStr}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent min-h-[3rem] w-full"
            />
            <p className="text-xs text-slate-400 pl-1">
              {formatTanggal(form.occurredOn)}
            </p>
          </div>

          {/* Catatan */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="dep-note" className="text-sm font-medium text-slate-700">
              Catatan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <input
              id="dep-note"
              name="note"
              type="text"
              value={form.note}
              onChange={handleChange}
              maxLength={200}
              placeholder="cth: Gaji bulan ini"
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`h-12 rounded-xl text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2 ${
              tab === 'setor' ? 'bg-rose-500' : 'bg-slate-700'
            }`}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Menyimpan…' : tab === 'setor' ? 'Catat Setoran' : 'Catat Penarikan'}
          </button>
        </form>
      </div>

      {/* Dialog konfirmasi simpan transaksi */}
      <ConfirmDialog
        isOpen={showConfirm}
        title={tab === 'setor' ? 'Konfirmasi Setoran' : 'Konfirmasi Penarikan'}
        message={`Catat ${tab === 'setor' ? 'setoran' : 'penarikan'} sebesar ${formatRupiah(parseInt(form.amount || '0', 10))} untuk target "${selectedGoal?.name ?? ''}"?`}
        confirmText={tab === 'setor' ? 'Ya, Setor' : 'Ya, Tarik'}
        variant="primary"
        loading={loading}
        onConfirm={handleExecuteSubmit}
        onCancel={() => !loading && setShowConfirm(false)}
      />
    </>
  )
}
