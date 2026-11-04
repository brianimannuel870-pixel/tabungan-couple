// src/components/RouteGuard.jsx
// Tiga jenis rute:
//   "public"  — hanya untuk tamu (Login, Daftar); jika sudah login → redirect
//   "auth"    — butuh login; jika belum → /login; jika sudah couple → /
//   "couple"  — butuh login + couple; jika belum couple → /pairing
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useData } from '../context/DataContext.jsx'

function Loading() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-slate-400">Menyiapkan tabungan…</p>
    </div>
  )
}

export function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (user) return <Navigate to={user.coupleId ? '/' : '/pairing'} replace />
  return children
}

export function AuthRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  // User sudah punya couple tidak perlu ada di /pairing
  if (user.coupleId) return <Navigate to="/" replace />
  return children
}

export function CoupleRoute({ children }) {
  const { user, loading: authLoading } = useAuth()
  const { isDataLoaded, error } = useData()

  // Tunggu auth check selesai dulu
  if (authLoading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (!user.coupleId) return <Navigate to="/pairing" replace />

  // Tunggu data tabungan siap (hanya tampil 1 kali loading terpadu tanpa overlay susulan)
  if (!isDataLoaded && !error) return <Loading />

  return children
}
