// src/components/BottomNav.jsx — navigasi bawah dengan tombol aksi di tengah
import { NavLink } from 'react-router-dom'
import { Home, Target, History, User, Plus } from 'lucide-react'

export default function BottomNav({ onAddClick, hasGoals }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-30">
      <div className="mx-auto max-w-md flex items-center h-16 px-2">
        {/* 1. Beranda */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 gap-0.5 transition ${
              isActive ? 'text-rose-500' : 'text-slate-400'
            }`
          }
        >
          <Home size={22} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Beranda</span>
        </NavLink>

        {/* 2. Target */}
        <NavLink
          to="/target"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 gap-0.5 transition ${
              isActive ? 'text-rose-500' : 'text-slate-400'
            }`
          }
        >
          <Target size={22} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Target</span>
        </NavLink>

        {/* 3. Tombol Tengah (FAB Setor) */}
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={onAddClick}
            disabled={!hasGoals}
            className="w-12 h-12 -mt-5 rounded-full bg-rose-500 text-white shadow-lg flex items-center justify-center active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed border-4 border-white"
            aria-label="Catat setoran atau penarikan"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>

        {/* 4. Riwayat */}
        <NavLink
          to="/riwayat"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 gap-0.5 transition ${
              isActive ? 'text-rose-500' : 'text-slate-400'
            }`
          }
        >
          <History size={22} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Riwayat</span>
        </NavLink>

        {/* 5. Profil */}
        <NavLink
          to="/profil"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-1 gap-0.5 transition ${
              isActive ? 'text-rose-500' : 'text-slate-400'
            }`
          }
        >
          <User size={22} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Profil</span>
        </NavLink>
      </div>
    </nav>
  )
}
