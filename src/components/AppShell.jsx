// src/components/AppShell.jsx — layout dengan BottomNav + FAB + Toast
import { useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import BottomNav from './BottomNav.jsx'
import FAB from './FAB.jsx'
import DepositSheet from './DepositSheet.jsx'
import Toast from './Toast.jsx'

// Rute yang menampilkan bottom nav + FAB
const SHELL_ROUTES = ['/', '/target', '/riwayat', '/profil']

export default function AppShell({ children, goals, onDepositSaved }) {
  const { pathname } = useLocation()
  const showShell = SHELL_ROUTES.some((r) =>
    r === '/' ? pathname === '/' : pathname.startsWith(r),
  )

  const [showDeposit, setShowDeposit] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSaved = useCallback((deposit) => {
    onDepositSaved?.(deposit)
    setToast({ message: deposit.type === 'setor' ? 'Setoran tercatat!' : 'Penarikan tercatat!', type: 'success' })
  }, [onDepositSaved])

  if (!showShell) return children

  return (
    <>
      {children}
      <BottomNav />
      {goals?.length > 0 && (
        <FAB onClick={() => setShowDeposit(true)} />
      )}
      {showDeposit && goals && (
        <DepositSheet
          goals={goals}
          onClose={() => setShowDeposit(false)}
          onSaved={handleSaved}
        />
      )}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  )
}

