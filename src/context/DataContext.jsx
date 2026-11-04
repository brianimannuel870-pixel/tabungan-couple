// src/context/DataContext.jsx — Global App Data Cache
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [couple, setCouple] = useState(null)
  const [recentDeposits, setRecentDeposits] = useState([])
  const [initialLoading, setInitialLoading] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [error, setError] = useState('')

  // Prefetch seluruh data inti saat user terautentikasi dan memiliki couple
  const refreshAllData = useCallback(async (showLoader = false) => {
    if (!user?.coupleId) {
      setGoals([])
      setCouple(null)
      setRecentDeposits([])
      setIsDataLoaded(false)
      return
    }

    if (showLoader) setInitialLoading(true)
    setError('')

    try {
      const [gData, cData, dData] = await Promise.all([
        api.get('/goals'),
        api.get('/couple'),
        api.get('/deposits?limit=10'),
      ])
      setGoals(gData.goals ?? [])
      setCouple(cData.couple ?? null)
      setRecentDeposits(dData.deposits ?? [])
      setIsDataLoaded(true)
    } catch (e) {
      setError(e.message)
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
      setIsDataLoaded(false)
    }
  }, [user?.coupleId, isDataLoaded, refreshAllData])

  // Helpers update state secara reaktif tanpa re-fetch total bila memungkinkan
  const updateGoals = useCallback((updater) => {
    setGoals((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])

  const reloadGoals = useCallback(async () => {
    if (!user?.coupleId) return
    try {
      const data = await api.get('/goals')
      setGoals(data.goals ?? [])
    } catch {}
  }, [user?.coupleId])

  const reloadRecentDeposits = useCallback(async () => {
    if (!user?.coupleId) return
    try {
      const data = await api.get('/deposits?limit=10')
      setRecentDeposits(data.deposits ?? [])
    } catch {}
  }, [user?.coupleId])

  const handleDepositSaved = useCallback(() => {
    // Refresh paralel data terkait setoran baru
    Promise.all([
      api.get('/goals').then((d) => setGoals(d.goals ?? [])).catch(() => {}),
      api.get('/couple').then((d) => setCouple(d.couple ?? null)).catch(() => {}),
      api.get('/deposits?limit=10').then((d) => setRecentDeposits(d.deposits ?? [])).catch(() => {}),
    ])
  }, [])

  const handleGoalUpdated = useCallback(() => {
    Promise.all([
      api.get('/goals').then((d) => setGoals(d.goals ?? [])).catch(() => {}),
      api.get('/couple').then((d) => setCouple(d.couple ?? null)).catch(() => {}),
    ])
  }, [])

  return (
    <DataContext.Provider
      value={{
        goals,
        couple,
        recentDeposits,
        initialLoading,
        isDataLoaded,
        error,
        refreshAllData,
        reloadGoals,
        reloadRecentDeposits,
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
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData harus dipakai di dalam DataProvider')
  return ctx
}
