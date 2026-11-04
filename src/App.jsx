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
  const [depositTrigger, setDepositTrigger] = useState(0)

  // Fungsi reload goals yang bisa dipanggil dari mana saja
  const loadGoals = useCallback(() => {
    if (!user?.coupleId) return
    api.get('/goals')
      .then((d) => setGoals(d.goals ?? []))
      .catch(() => {})
  }, [user?.coupleId])

  // Muat goals saat user sudah punya couple
  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const handleDepositSaved = useCallback(() => {
    // 1. Refresh goals agar saldo di FAB & list ter-update
    loadGoals()
    // 2. Increment trigger agar Beranda me-refresh daftar 10 aktivitas
    setDepositTrigger((prev) => prev + 1)
  }, [loadGoals])

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
            <Beranda depositTrigger={depositTrigger} />
          </AppShell>
        </CoupleRoute>
      } />
      <Route path="/target" element={
        <CoupleRoute>
          <AppShell goals={goals} onDepositSaved={handleDepositSaved}>
            <Target onGoalCreated={loadGoals} />
          </AppShell>
        </CoupleRoute>
      } />
      <Route path="/target/:id" element={
        <CoupleRoute>
          <AppShell goals={goals} onDepositSaved={handleDepositSaved}>
            <GoalDetail onGoalUpdated={loadGoals} />
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
