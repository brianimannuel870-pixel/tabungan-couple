// src/pages/Pairing.jsx
import { useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../hooks/useAuth.jsx'

export default function Pairing() {
  const { user } = useAuth()

  const [tab, setTab] = useState('buat') // 'buat' | 'gabung'
  const [kode, setKode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBuat() {
    setError('')
    setLoading(true)
    try {
      await api.post('/couple/create', {})
      // Hard reload agar AuthProvider re-fetch /auth/me dengan coupleId baru
      window.location.replace('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGabung(e) {
    e.preventDefault()
    setError('')
    if (kode.trim().length !== 6) {
      setError('Kode harus 6 karakter.')
      return
    }
    setLoading(true)
    try {
      await api.post('/couple/join', { inviteCode: kode.trim().toUpperCase() })
      window.location.replace('/')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-3">
            <Heart size={28} className="text-rose-500" strokeWidth={1.75} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Buat Ruang Couple</h1>
          <p className="text-sm text-slate-500 mt-1">
            Hei, <span className="font-medium text-slate-700">{user?.name}</span>! Ajak pasanganmu bergabung.
          </p>
        </div>

        {/* Tab */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-4">
          {['buat', 'gabung'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 h-10 rounded-lg text-sm font-medium transition ${
                tab === t
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              {t === 'buat' ? 'Buat Ruang' : 'Masukkan Kode'}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {tab === 'buat' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-500 text-center">
                Buat Ruang Couple baru dan bagikan kode undangan ke pasanganmu.
              </p>
              <button
                onClick={handleBuat}
                disabled={loading}
                className="h-12 rounded-xl bg-rose-500 text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Membuat…' : 'Buat Ruang Couple'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleGabung} className="flex flex-col gap-4">
              <p className="text-sm text-slate-500 text-center">
                Minta kode 6 karakter dari pasanganmu.
              </p>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="kode" className="text-sm font-medium text-slate-700">
                  Kode Undangan
                </label>
                <input
                  id="kode"
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  maxLength={6}
                  required
                  value={kode}
                  onChange={(e) => setKode(e.target.value.toUpperCase())}
                  placeholder="Contoh: AB3K7M"
                  className="h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 tracking-widest text-center placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading || kode.length !== 6}
                className="h-12 rounded-xl bg-rose-500 text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                {loading ? 'Bergabung…' : 'Bergabung'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Satu akun hanya bisa bergabung di satu Ruang Couple.
        </p>
      </div>
    </div>
  )
}
