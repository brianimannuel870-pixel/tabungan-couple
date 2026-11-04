// src/components/PwaInstallPrompt.jsx — Modal pop up ajakan install PWA
import { useState, useEffect } from 'react'
import { Download, Share2, X, Sparkles } from 'lucide-react'

const STORAGE_KEY = 'pwa_prompt_dismissed_until'

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)

  useEffect(() => {
    // 1. Cek apakah app sudah berjalan dalam mode standalone (sudah terinstall)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    if (isStandalone) return

    // 2. Cek apakah user memilih "Ingatkan Nanti" sebelumnya
    const dismissedUntil = localStorage.getItem(STORAGE_KEY)
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return
    }

    // 3. Deteksi Safari iOS
    const ua = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(ua) && !/crios|fxios|opios/.test(ua)
    setIsIos(isIosDevice)

    // Tangkap event install standar (Chrome, Edge, Android)
    function handleBeforeInstallPrompt(e) {
      e.preventDefault()
      setDeferredPrompt(e)
      // Tampilkan popup setelah delay singkat agar tidak mengagetkan user
      setTimeout(() => setShowPrompt(true), 1200)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Untuk iOS Safari, tampilkan prompt dengan panduan "Add to Home Screen"
    if (isIosDevice) {
      setTimeout(() => setShowPrompt(true), 1800)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  function handleRemindLater() {
    // Tunda popup selama 3 hari
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000
    localStorage.setItem(STORAGE_KEY, String(Date.now() + threeDaysMs))
    setShowPrompt(false)
  }

  async function handleInstall() {
    if (isIos) {
      setShowIosGuide(true)
      return
    }

    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[80] animate-fade-in"
        onClick={handleRemindLater}
        aria-hidden
      />

      {/* Card Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-4 bottom-6 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 z-[81] max-w-sm mx-auto bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col gap-3.5 animate-sheet-up"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-200 shrink-0">
            <Download size={24} strokeWidth={2.2} />
          </div>
          <button
            onClick={handleRemindLater}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
            aria-label="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              Pasang Aplikasi Tabungan?
            </h3>
            <Sparkles size={16} className="text-amber-500 fill-amber-500" />
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Pasang Tabungan Couple di layar utama HP agar lebih cepat dibuka dan serasa aplikasi asli tanpa repot buka browser.
          </p>
        </div>

        {/* Panduan khusus iOS jika tombol Pasang ditekan di iPhone/iPad */}
        {showIosGuide && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 flex flex-col gap-1.5">
            <p className="font-semibold flex items-center gap-1">
              <Share2 size={14} /> Cara pasang di iPhone / iPad:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-rose-800">
              <li>Tekan tombol <strong>Bagikan (Share)</strong> di menu bawah Safari.</li>
              <li>Gulir ke bawah dan pilih <strong>Tambah ke Layar Utama</strong> (Add to Home Screen).</li>
            </ol>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex gap-2.5 mt-1">
          <button
            type="button"
            onClick={handleRemindLater}
            className="flex-1 h-11 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 active:scale-[0.98] transition"
          >
            Ingatkan Nanti
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="flex-1 h-11 rounded-xl bg-rose-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm shadow-rose-200 hover:bg-rose-600 transition"
          >
            Pasang
          </button>
        </div>
      </div>
    </>
  )
}
