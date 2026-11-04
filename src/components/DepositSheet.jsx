// src/components/DepositSheet.jsx — modal bottom sheet setor / tarik dengan fixed header & footer
import { useState, useEffect, useCallback } from 'react'
import { Loader2, Calendar } from 'lucide-react'
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

      {/* Sheet Modal Container */}
      <div
        className={`sheet fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-xl flex flex-col max-h-[90dvh] transition-transform duration-200 ease-out overscroll-contain ${
          isClosing
            ? 'translate-y-full'
            : 'translate-y-0 animate-sheet-up'
        }`}
      >
        {/* Drag handle bar */}
        <div className="pt-3 pb-1" onClick={handleClose} role="button" aria-label="Tutup sheet">
          <div className="w-10 h-1 bg-slate-200 hover:bg-slate-300 transition rounded-full mx-auto cursor-pointer" />
        </div>

        {/* 1. Header Fixed Top: Tab Setor & Tarik Penuh */}
        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center shrink-0 bg-white">
          <div className="w-full flex bg-slate-100 rounded-xl p-1">
            {['setor', 'tarik'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError('') }}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition capitalize flex items-center justify-center ${
                  tab === t
                    ? t === 'setor'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'setor' ? '+ Setor' : '− Tarik'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Scrollable Body: Form Input Fields */}
        <form id="deposit-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
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
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
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
                className="h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent w-full tabular-nums text-base"
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
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent min-h-[3rem] w-full text-base"
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
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-base"
            />
          </div>
        </form>

        {/* 3. Footer Fixed Bottom: Tombol Simpan Transaksi */}
        <div className="p-4 px-6 border-t border-slate-100 bg-white shrink-0 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="submit"
            form="deposit-form"
            disabled={loading}
            className={`w-full h-12 rounded-xl text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm ${
              tab === 'setor'
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                : 'bg-slate-800 hover:bg-slate-900 shadow-slate-300'
            }`}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Menyimpan…' : tab === 'setor' ? 'Catat Setoran' : 'Catat Penarikan'}
          </button>
        </div>
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
