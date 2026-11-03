// src/components/RouteGuard.jsx
// Tiga jenis rute:
//   "public"  — hanya untuk tamu (Login, Daftar); jika sudah login → redirect
//   "auth"    — butuh login; jika belum → /login
//   "couple"  — butuh login + couple; jika belum couple → /pairing
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

function Loading() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
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
  return children
}

export function CoupleRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (!user.coupleId) return <Navigate to="/pairing" replace />
  return children
}
