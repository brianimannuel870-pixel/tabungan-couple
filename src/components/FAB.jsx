// src/components/FAB.jsx — Floating Action Button "+ Setor"
import { Plus } from 'lucide-react'

export default function FAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-30
        w-14 h-14 rounded-full bg-rose-500 shadow-lg flex items-center justify-center
        text-white active:scale-95 transition"
      aria-label="Catat transaksi"
    >
      <Plus size={24} strokeWidth={2} />
    </button>
  )
}

