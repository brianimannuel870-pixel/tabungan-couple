// src/components/BottomNav.jsx — navigasi bawah
import { NavLink } from 'react-router-dom'
import { Home, Target, History, User } from 'lucide-react'

const NAV = [
  { to: '/', icon: Home, label: 'Beranda', exact: true },
  { to: '/target', icon: Target, label: 'Target' },
  { to: '/riwayat', icon: History, label: 'Riwayat' },
  { to: '/profil', icon: User, label: 'Profil' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-slate-200 pb-[env(safe-area-inset-bottom)] z-30">
      <div className="mx-auto max-w-md flex">
        {NAV.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition ${
                isActive ? 'text-rose-500' : 'text-slate-400'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.75} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

