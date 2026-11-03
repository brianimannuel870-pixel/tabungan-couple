// src/components/GoalCard.jsx
import { Link } from 'react-router-dom'
import ProgressBar from './ProgressBar.jsx'
import { formatRupiah } from '../lib/format.js'

export default function GoalCard({ goal }) {
  const percent = goal.targetAmount > 0
    ? Math.round((goal.balance / goal.targetAmount) * 100)
    : 0

  return (
    <Link
      to={`/target/${goal.id}`}
      className="block bg-white rounded-2xl border border-slate-200 shadow-sm p-4 active:scale-[0.99] transition"
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl leading-none mt-0.5" aria-hidden>
          {goal.icon || '🎯'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-slate-900 truncate">{goal.name}</p>
            {goal.isDone && (
              <span className="shrink-0 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Selesai
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {formatRupiah(goal.balance)}{' '}
            <span className="text-slate-400">/ {formatRupiah(goal.targetAmount)}</span>
          </p>
        </div>
      </div>
      <ProgressBar percent={percent} />
      <p className="text-right text-xs text-slate-500 mt-1">{percent}%</p>
    </Link>
  )
}

