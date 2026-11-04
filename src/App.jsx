import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'
import { DataProvider, useData } from './context/DataContext.jsx'
import { PublicRoute, AuthRoute, CoupleRoute } from './components/RouteGuard.jsx'
import AppShell from './components/AppShell.jsx'
import PwaInstallPrompt from './components/PwaInstallPrompt.jsx'
import Login from './pages/Login.jsx'
import Daftar from './pages/Daftar.jsx'
import Pairing from './pages/Pairing.jsx'
import Beranda from './pages/Beranda.jsx'
import Target from './pages/Target.jsx'
import GoalDetail from './pages/GoalDetail.jsx'
import Riwayat from './pages/Riwayat.jsx'
import Profil from './pages/Profil.jsx'

function AuthedApp() {
  const { goals, handleDepositSaved, handleGoalUpdated } = useData()

  return (
    <>
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
              <GoalDetail onGoalUpdated={handleGoalUpdated} />
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

      {/* Pop up ajakan pasang PWA */}
      <PwaInstallPrompt />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <AuthedApp />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
