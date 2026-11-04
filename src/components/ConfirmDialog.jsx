// src/components/ConfirmDialog.jsx — Modal dialog konfirmasi reusable
import { useEffect } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

export default function ConfirmDialog({
  isOpen,
  title = 'Konfirmasi',
  message = 'Apakah kamu yakin ingin melanjutkan tindakan ini?',
  confirmText = 'Lanjutkan',
  cancelText = 'Batal',
  variant = 'primary', // 'primary' (rose) | 'danger' (red)
  loading = false,
  onConfirm,
  onCancel,
}) {
  // Cegah scroll tembus ke background (Safari iOS / mobile)
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Tangkap Escape key eksklusif & cegah bubbling ke modal di bawahnya
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation()
        e.stopImmediatePropagation?.()
        if (!loading) onCancel()
      }
    }
    // Pakai capture phase agar ConfirmDialog menangani Escape sebelum parent sheet
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [isOpen, loading, onCancel])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop dengan overscroll-contain */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[70] animate-fade-in overscroll-contain touch-none"
        onClick={() => !loading && onCancel()}
        aria-hidden
      />

      {/* Dialog card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[71] max-w-sm mx-auto bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-3 overscroll-contain"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-red-50 text-red-500'
                : 'bg-rose-50 text-rose-500'
            }`}
          >
            <AlertCircle size={20} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 h-11 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-60 ${
              variant === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-rose-500 hover:bg-rose-600'
            }`}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </>
  )
}

