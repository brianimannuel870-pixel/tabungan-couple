// src/pages/Profil.jsx
import { useState } from 'react'
import { Copy, Check, LogOut, Users, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.jsx'
import { useData } from '../context/DataContext.jsx'
import { formatTanggal } from '../lib/format.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

export default function Profil() {
  const { user, logout } = useAuth()
  const { couple, isDataLoaded, error: globalError } = useData()

  const [copied, setCopied] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const loadingCouple = !isDataLoaded
  const errorCouple = globalError

  async function handleCopy() {
    if (!couple?.inviteCode) return
    try {
      await navigator.clipboard.writeText(couple.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback untuk browser lama
      const el = document.createElement('textarea')
      el.value = couple.inviteCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      window.location.replace('/login')
    } finally {
      setLoggingOut(false)
      setConfirmLogout(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-md px-4 pt-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Profil</h1>

        {/* Info user */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-semibold text-lg shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-sm text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Ruang Couple */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-rose-500" strokeWidth={1.75} />
            <h2 className="text-base font-medium text-slate-900">Ruang Couple</h2>
          </div>

          {loadingCouple ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : errorCouple ? (
            <p className="text-sm text-red-500">{errorCouple}</p>
          ) : couple ? (
            <>
              {/* Kode undangan */}
              <p className="text-xs text-slate-500 mb-1">Kode Undangan</p>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl h-12 flex items-center px-4">
                  <span className="font-bold text-slate-900 tracking-[0.3em] tabular-nums">
                    {couple.inviteCode}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 active:scale-[0.95] transition"
                  aria-label={copied ? 'Tersalin' : 'Salin kode'}
                >
                  {copied
                    ? <Check size={18} className="text-emerald-500" />
                    : <Copy size={18} className="text-rose-500" />
                  }
                </button>
              </div>
              {copied && (
                <p className="text-xs text-emerald-600 -mt-2 mb-3">Tersalin!</p>
              )}

              {/* Anggota */}
              <p className="text-xs text-slate-500 mb-2">Anggota</p>
              <div className="flex flex-col gap-2">
                {couple.members?.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-semibold text-sm shrink-0">
                      {m.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {m.name}
                        {m.id === user?.id && (
                          <span className="ml-1.5 text-xs text-slate-400 font-normal">(kamu)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        Bergabung {formatTanggal(m.joinedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>

        {/* Logout */}
        <button
          onClick={() => setConfirmLogout(true)}
          disabled={loggingOut}
          className="w-full h-12 rounded-xl border border-slate-200 bg-white text-red-500 font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
        >
          {loggingOut
            ? <Loader2 size={18} className="animate-spin" />
            : <LogOut size={18} strokeWidth={1.75} />
          }
          {loggingOut ? 'Keluar…' : 'Keluar'}
        </button>
      </div>

      {/* Dialog Konfirmasi Logout */}
      <ConfirmDialog
        isOpen={confirmLogout}
        title="Keluar dari Akun?"
        message="Kamu harus memasukkan email dan password lagi untuk masuk kembali."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => !loggingOut && setConfirmLogout(false)}
      />
    </div>
  )
}
