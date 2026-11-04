// src/context/DataContext.jsx — Global App Data Cache
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [couple, setCouple] = useState(null)
  const [recentDeposits, setRecentDeposits] = useState([])
  // Simpan data setoran 35 hari terakhir untuk kalender & streak akurat
  const [calendarDeposits, setCalendarDeposits] = useState([])
  // Cache data riwayat halaman pertama default (all filter, page 1)
  const [initialHistory, setInitialHistory] = useState({
    deposits: [],
    pagination: { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
    loaded: false,
  })
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [error, setError] = useState('')

  // Prefetch seluruh data inti saat user login & ada couple
  const refreshAllData = useCallback(async () => {
    if (!user?.coupleId) {
      setGoals([])
      setCouple(null)
      setRecentDeposits([])
      setCalendarDeposits([])
      setInitialHistory({
        deposits: [],
        pagination: { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
        loaded: false,
      })
      setIsDataLoaded(false)
      setError('')
      return
    }

    setError('')

    try {
      const [gData, cData, dData, calData] = await Promise.all([
        api.get('/goals'),
        api.get('/couple'),
        api.get('/deposits?page=1&limit=10'),
        api.get('/deposits?page=1&limit=50'), // Data cukup untuk kalender 1 bulan & streak
      ])
      setGoals(gData.goals ?? [])
      setCouple(cData.couple ?? null)
      setRecentDeposits(dData.deposits ?? [])
      setCalendarDeposits(calData.deposits ?? [])
      setInitialHistory({
        deposits: dData.deposits ?? [],
        pagination: dData.pagination ?? { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
        loaded: true,
      })
      setIsDataLoaded(true)
    } catch (e) {
      setError(e.message || 'Gagal memuat data tabungan.')
    }
  }, [user?.coupleId])

  // Efek bootstrap data awal
  useEffect(() => {
    if (user?.coupleId && !isDataLoaded) {
      refreshAllData()
    } else if (!user?.coupleId) {
      setGoals([])
      setCouple(null)
      setRecentDeposits([])
      setCalendarDeposits([])
      setInitialHistory({
        deposits: [],
        pagination: { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
        loaded: false,
      })
      setIsDataLoaded(false)
      setError('')
    }
  }, [user?.coupleId, isDataLoaded, refreshAllData])

  // Sinkronisasi penuh saat mutasi (setor / tarik)
  const handleDepositSaved = useCallback(() => {
    Promise.all([
      api.get('/goals').then((d) => setGoals(d.goals ?? [])).catch(() => {}),
      api.get('/couple').then((d) => setCouple(d.couple ?? null)).catch(() => {}),
      api.get('/deposits?page=1&limit=10').then((d) => {
        setRecentDeposits(d.deposits ?? [])
        setInitialHistory({
          deposits: d.deposits ?? [],
          pagination: d.pagination ?? { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
          loaded: true,
        })
      }).catch(() => {}),
      api.get('/deposits?page=1&limit=50').then((d) => {
        setCalendarDeposits(d.deposits ?? [])
      }).catch(() => {}),
    ])
  }, [])

  // Sinkronisasi penuh saat target ditambah / diubah / dihapus
  const handleGoalUpdated = useCallback(() => {
    Promise.all([
      api.get('/goals').then((d) => setGoals(d.goals ?? [])).catch(() => {}),
      api.get('/couple').then((d) => setCouple(d.couple ?? null)).catch(() => {}),
      api.get('/deposits?page=1&limit=10').then((d) => {
        setRecentDeposits(d.deposits ?? [])
        setInitialHistory({
          deposits: d.deposits ?? [],
          pagination: d.pagination ?? { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
          loaded: true,
        })
      }).catch(() => {}),
      api.get('/deposits?page=1&limit=50').then((d) => {
        setCalendarDeposits(d.deposits ?? [])
      }).catch(() => {}),
    ])
  }, [])

  const updateGoals = useCallback((updater) => {
    setGoals((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])

  return (
    <DataContext.Provider
      value={{
        goals,
        couple,
        recentDeposits,
        calendarDeposits,
        initialHistory,
        setInitialHistory,
        isDataLoaded,
        error,
        refreshAllData,
        updateGoals,
        handleDepositSaved,
        handleGoalUpdated,
      }}
    >
      {/* Error Fallback jika fetch awal gagal total */}
      {!isDataLoaded && error && user?.coupleId && (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Gagal Memuat Data</h3>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              onClick={() => refreshAllData()}
              className="mt-2 h-11 px-5 rounded-xl bg-rose-500 text-white text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition w-full"
            >
              <RefreshCw size={16} /> Coba Lagi
            </button>
          </div>
        </div>
      )}

      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData harus dipakai di dalam DataProvider')
  return ctx
}
