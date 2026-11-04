// src/components/GoalFormSheet.jsx — bottom sheet buat/ubah target dengan animasi buka & tutup
import { useState, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { formatRupiah } from '../lib/format.js'
import ConfirmDialog from './ConfirmDialog.jsx'

const EMOJI_OPTIONS = ['🎯','🏠','✈️','💍','🎓','🚗','📱','👶','🐶','🌴','💰','🎮']

export default function GoalFormSheet({ goal, onClose, onSave }) {
  const isEdit = Boolean(goal)

  const [form, setForm] = useState({
    name: goal?.name ?? '',
    targetAmount: goal?.targetAmount ? String(goal.targetAmount) : '',
    deadline: goal?.deadline ?? '',
    icon: goal?.icon ?? '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 200)
  }, [onClose])

  // Tutup dengan Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const amount = parseInt(form.targetAmount.replace(/\D/g, ''), 10)
    if (!form.name.trim()) return setError('Nama target wajib diisi.')
    if (!amount || amount <= 0) return setError('Nominal target harus lebih dari 0.')

    setShowConfirm(true)
  }

  async function handleExecuteSave() {
    const amount = parseInt(form.targetAmount.replace(/\D/g, ''), 10)
    setLoading(true)
    try {
      await onSave({
        name: form.name.trim(),
        targetAmount: amount,
        deadline: form.deadline || null,
        icon: form.icon || null,
      })
      setShowConfirm(false)
      handleClose()
    } catch (e) {
      setError(e.message)
      setShowConfirm(false)
    } finally {
      setLoading(false)
    }
  }

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
        {/* Handle bar */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Ubah Target' : 'Buat Target Baru'}
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Pilih emoji */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Ikon (opsional)</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, icon: f.icon === emoji ? '' : emoji }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                    form.icon === emoji
                      ? 'bg-rose-100 ring-2 ring-rose-500'
                      : 'bg-slate-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-name" className="text-sm font-medium text-slate-700">
              Nama Target <span className="text-red-400">*</span>
            </label>
            <input
              id="goal-name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="cth: Liburan ke Bali"
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          {/* Nominal */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-amount" className="text-sm font-medium text-slate-700">
              Nominal Target <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium pointer-events-none">
                Rp
              </span>
              <input
                id="goal-amount"
                name="targetAmount"
                type="text"
                inputMode="numeric"
                required
                value={form.targetAmount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  setForm((f) => ({ ...f, targetAmount: raw }))
                }}
                placeholder="0"
                className="h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent w-full tabular-nums"
              />
            </div>
          </div>

          {/* Tenggat */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="goal-deadline" className="text-sm font-medium text-slate-700">
              Tenggat (opsional)
            </label>
            <input
              id="goal-deadline"
              name="deadline"
              type="date"
              value={form.deadline}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent min-h-[3rem]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 rounded-xl bg-rose-500 text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Buat Target'}
          </button>
        </form>
      </div>

      {/* Dialog konfirmasi simpan target */}
      <ConfirmDialog
        isOpen={showConfirm}
        title={isEdit ? 'Simpan Perubahan Target?' : 'Buat Target Baru?'}
        message={
          isEdit
            ? `Simpan perubahan target "${form.name.trim()}" dengan nominal ${formatRupiah(parseInt(form.targetAmount || '0', 10))}?`
            : `Buat target "${form.name.trim()}" dengan target tabungan ${formatRupiah(parseInt(form.targetAmount || '0', 10))}?`
        }
        confirmText={isEdit ? 'Ya, Simpan' : 'Ya, Buat'}
        variant="primary"
        loading={loading}
        onConfirm={handleExecuteSave}
        onCancel={() => !loading && setShowConfirm(false)}
      />
    </>
  )
}
