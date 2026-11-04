// src/pages/Target.jsx — daftar target
import { useState, useEffect } from 'react'
import { Plus, Target as TargetIcon, Loader2 } from 'lucide-react'
import { api } from '../lib/api.js'
import GoalCard from '../components/GoalCard.jsx'
import GoalFormSheet from '../components/GoalFormSheet.jsx'

export default function Target({ onGoalCreated }) {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.get('/goals')
      .then((data) => setGoals(data.goals))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(formData) {
    const data = await api.post('/goals', formData)
    setGoals((prev) => [data.goal, ...prev])
    onGoalCreated?.()
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-24">
      <div className="mx-auto w-full max-w-md px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-slate-900">Target Tabungan</h1>
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white active:scale-[0.95] transition"
            aria-label="Buat target baru"
          >
            <Plus size={20} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <TargetIcon size={40} className="text-slate-300" strokeWidth={1.5} />
            <p className="text-slate-500 text-sm text-center">
              Belum ada target. Yuk buat target pertama kalian!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-1 h-10 px-5 rounded-xl bg-rose-500 text-white text-sm font-medium active:scale-[0.98] transition"
            >
              Buat Target
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <GoalFormSheet
          onClose={() => setShowForm(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  )
}

