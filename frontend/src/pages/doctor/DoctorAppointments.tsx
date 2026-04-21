import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appointmentApi } from '../../api'
import { PageHeader, AppointmentCard, EmptyState, LoadingSpinner } from '../../components/common'
import { Calendar, CheckCircle, Search, FileText, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_TABS = ['ALL', 'SCHEDULED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']

export default function DoctorAppointments() {
  const navigate = useNavigate()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [completingId, setCompletingId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    appointmentApi.getMy().then(r => setAppointments(r.data.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleComplete = async (id: number) => {
    const notes = window.prompt('Add consultation notes (optional):') ?? ''
    setCompletingId(id)
    try {
      await appointmentApi.complete(id, notes)
      toast.success('Appointment marked as completed!')
      load()
    } catch { /* error shown by interceptor */ }
    finally { setCompletingId(null) }
  }

  const counts: Record<string, number> = { ALL: appointments.length }
  STATUS_TABS.slice(1).forEach(t => {
    counts[t] = appointments.filter(a => a.status === t).length
  })

  const filtered = appointments
    .filter(a => filter === 'ALL' || a.status === filter)
    .filter(a => !search || a.patientName?.toLowerCase().includes(search.toLowerCase()))

  const pendingRx = appointments.filter(a => a.status === 'COMPLETED' && !a.hasPrescription).length

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Appointments"
        subtitle={`${appointments.length} total appointments`}
      />

      {/* Pending prescriptions banner */}
      {pendingRx > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium flex-1">
            {pendingRx} completed appointment{pendingRx > 1 ? 's' : ''} awaiting prescription
          </p>
          <button onClick={() => navigate('/doctor/prescriptions')}
            className="text-sm text-amber-700 underline font-medium">
            Write Now
          </button>
        </div>
      )}

      {/* Search + filter tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by patient name…" className="input pl-9 text-sm" />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filter === t
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
            }`}>
            {t} <span className="opacity-70">({counts[t] ?? 0})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments"
          subtitle={search ? `No results for "${search}"` : 'Your appointment list is empty'} />
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <AppointmentCard key={a.id} appointment={a} role="DOCTOR" actions={
              <div className="flex gap-2 flex-wrap">
                {(a.status === 'SCHEDULED' || a.status === 'RESCHEDULED') && (
                  <button
                    onClick={() => handleComplete(a.id)}
                    disabled={completingId === a.id}
                    className="btn-primary text-xs py-1.5 px-3">
                    <CheckCircle className="w-3 h-3" />
                    {completingId === a.id ? 'Saving…' : 'Complete'}
                  </button>
                )}
                {a.status === 'COMPLETED' && !a.hasPrescription && (
                  <button onClick={() => navigate('/doctor/prescriptions')}
                    className="btn-secondary text-xs py-1.5 px-3 text-purple-600 border-purple-200 hover:bg-purple-50">
                    <FileText className="w-3 h-3" /> Add Rx
                  </button>
                )}
                {a.hasPrescription && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 px-2">
                    <CheckCircle className="w-3 h-3" /> Rx Added
                  </span>
                )}
              </div>
            } />
          ))}
        </div>
      )}
    </div>
  )
}
