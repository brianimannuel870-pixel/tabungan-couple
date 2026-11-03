// src/components/ProgressBar.jsx
export default function ProgressBar({ percent }) {
  const clamped = Math.min(100, Math.max(0, percent))
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-rose-500 rounded-full transition-all duration-500"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}

