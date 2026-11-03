import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import { PublicRoute, AuthRoute, CoupleRoute } from './components/RouteGuard.jsx'
import AppShell from './components/AppShell.jsx'
import Login from './pages/Login.jsx'
import Daftar from './pages/Daftar.jsx'
import Pairing from './pages/Pairing.jsx'
import Beranda from './pages/Beranda.jsx'
import Target from './pages/Target.jsx'
import GoalDetail from './pages/GoalDetail.jsx'
import Riwayat from './pages/Riwayat.jsx'
import Profil from './pages/Profil.jsx'
import { api } from './lib/api.js'
import { useAuth } from './hooks/useAuth.jsx'

function AuthedApp() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])

  // Muat goals saat user sudah punya couple
  useEffect(() => {
    if (!user?.coupleId) return
    api.get('/goals')
      .then((d) => setGoals(d.goals))
      .catch(() => {})
  }, [user?.coupleId])

  const handleDepositSaved = useCallback(() => {
    // Refresh goals agar saldo FAB terbaru
    api.get('/goals').then((d) => setGoals(d.goals)).catch(() => {})
  }, [])

  return (
    <Routes>
      {/* Publik */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/daftar" element={<PublicRoute><Daftar /></PublicRoute>} />

      {/* Login, belum couple */}
      <Route path="/pairing" element={<AuthRoute><Pairing /></AuthRoute>} />

      {/* Login + couple — dibungkus AppShell */}
      <Route path="/" element={
        <CoupleRoute>
          <AppShell goals={goals} onDepositSaved={handleDepositSaved}>
            <Beranda />
          </AppShell>
        </CoupleRoute>
      } />
      <Route path="/target" element={
        <CoupleRoute>
          <AppShell goals={goals} onDepositSaved={handleDepositSaved}>
            <Target />
          </AppShell>
        </CoupleRoute>
      } />
      <Route path="/target/:id" element={
        <CoupleRoute>
          <AppShell goals={goals} onDepositSaved={handleDepositSaved}>
            <GoalDetail />
          </AppShell>
        </CoupleRoute>
      } />
      <Route path="/riwayat" element={
        <CoupleRoute>
          <AppShell goals={goals} onDepositSaved={handleDepositSaved}>
            <Riwayat />
          </AppShell>
        </CoupleRoute>
      } />
      <Route path="/profil" element={
        <CoupleRoute>
          <AppShell goals={goals} onDepositSaved={handleDepositSaved}>
            <Profil />
          </AppShell>
        </CoupleRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthedApp />
      </AuthProvider>
    </BrowserRouter>
  )
}
