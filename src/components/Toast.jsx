// src/components/Toast.jsx — feedback ringan sukses/gagal
import { useEffect } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export default function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div className="fixed top-4 inset-x-4 z-[60] flex justify-center pointer-events-none">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium pointer-events-auto
          ${type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}
      >
        {type === 'success'
          ? <CheckCircle size={16} strokeWidth={2} />
          : <XCircle size={16} strokeWidth={2} />
        }
        {message}
      </div>
    </div>
  )
}

