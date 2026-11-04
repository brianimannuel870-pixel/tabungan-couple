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
  // Cache data riwayat halaman pertama default (all filter, page 1)
  const [initialHistory, setInitialHistory] = useState({
    deposits: [],
    pagination: { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
    loaded: false,
  })
  const [initialLoading, setInitialLoading] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [error, setError] = useState('')

  // Prefetch seluruh data inti saat user login & ada couple
  const refreshAllData = useCallback(async (showLoader = false) => {
    if (!user?.coupleId) {
      setGoals([])
      setCouple(null)
      setRecentDeposits([])
      setInitialHistory({
        deposits: [],
        pagination: { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
        loaded: false,
      })
      setIsDataLoaded(false)
      setError('')
      return
    }

    if (showLoader) setInitialLoading(true)
    setError('')

    try {
      const [gData, cData, dData] = await Promise.all([
        api.get('/goals'),
        api.get('/couple'),
        api.get('/deposits?page=1&limit=10'),
      ])
      setGoals(gData.goals ?? [])
      setCouple(cData.couple ?? null)
      setRecentDeposits(dData.deposits ?? [])
      setInitialHistory({
        deposits: dData.deposits ?? [],
        pagination: dData.pagination ?? { page: 1, totalPages: 1, total: 0, hasNext: false, hasPrev: false },
        loaded: true,
      })
      setIsDataLoaded(true)
    } catch (e) {
      setError(e.message || 'Gagal memuat data tabungan.')
    } finally {
      if (showLoader) setInitialLoading(false)
    }
  }, [user?.coupleId])

  // Efek bootstrap data awal
  useEffect(() => {
    if (user?.coupleId && !isDataLoaded) {
      refreshAllData(true)
    } else if (!user?.coupleId) {
      setGoals([])
      setCouple(null)
      setRecentDeposits([])
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
        initialHistory,
        setInitialHistory,
        initialLoading,
        isDataLoaded,
        error,
        refreshAllData,
        updateGoals,
        handleDepositSaved,
        handleGoalUpdated,
      }}
    >
      {/* Loading Overlay saat data diinject pertama kali setelah login */}
      {initialLoading && (
        <div className="fixed inset-0 z-[100] bg-slate-50/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600 animate-pulse">Menyiapkan data tabungan…</p>
        </div>
      )}

      {/* Error Fallback jika prefetch awal gagal total */}
      {!initialLoading && !isDataLoaded && error && user?.coupleId && (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Gagal Memuat Data</h3>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              onClick={() => refreshAllData(true)}
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
