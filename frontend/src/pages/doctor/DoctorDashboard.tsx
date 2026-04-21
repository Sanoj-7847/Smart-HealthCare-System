import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { appointmentApi, notificationApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import {
  Calendar, CheckCircle, Clock, Users, FileText,
  Bell, Video, TrendingUp, ArrowUpRight, Stethoscope,
  ChevronRight, Activity
} from 'lucide-react'

/* ─── tiny helpers ─────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; dot: string; pill: string }> = {
  COMPLETED:   { label: 'Done',      dot: 'bg-emerald-400', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  CANCELLED:   { label: 'Cancelled', dot: 'bg-red-400',     pill: 'bg-red-50 text-red-600 ring-red-200' },
  SCHEDULED:   { label: 'Upcoming',  dot: 'bg-sky-400',     pill: 'bg-sky-50 text-sky-700 ring-sky-200' },
  RESCHEDULED: { label: 'Rescheduled',dot:'bg-amber-400',   pill: 'bg-amber-50 text-amber-700 ring-amber-200' },
}

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const avatar = (name?: string) =>
  name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

/* ─── component ────────────────────────────────────────── */
export default function DoctorDashboard() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()

  const [appointments,      setAppointments]      = useState<any[]>([])
  const [todayAppointments, setTodayAppointments] = useState<any[]>([])
  const [notifications,     setNotifications]     = useState<any[]>([])
  const [loading,           setLoading]           = useState(true)

  const load = () => {
    const today = new Date().toISOString().split('T')[0]
    Promise.all([
      appointmentApi.getMy(),
      appointmentApi.getByDate(today),
      notificationApi.getAll(),
    ]).then(([all, tod, notif]) => {
      setAppointments(all.data.data || [])
      setTodayAppointments(tod.data.data || [])
      setNotifications((notif.data.data || []).slice(0, 5))
    }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  /* derived */
  const scheduled   = appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'RESCHEDULED').length
  const completed   = appointments.filter(a => a.status === 'COMPLETED').length
  const pendingRx   = appointments.filter(a => a.status === 'COMPLETED' && !a.hasPrescription)
  const unreadNotif = notifications.filter(n => !n.isRead).length
  const revenue     = appointments.filter(a => a.paymentStatus === 'PAID').reduce((s, a) => s + (a.consultationFee || 0), 0)

  const handleComplete = async (id: number) => {
    const notes = prompt('Doctor notes (optional):') || ''
    await appointmentApi.complete(id, notes)
    load()
  }

  /* ── loading ── */
  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-[3px] border-neutral-100" />
        <div className="absolute inset-0 rounded-full border-[3px] border-t-indigo-500 animate-spin" />
      </div>
    </div>
  )

  const dateStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      {/* ── google font ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');

        .dash * { font-family: 'DM Sans', sans-serif; }
        .mono   { font-family: 'DM Mono', monospace; }

        @keyframes up { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        .up { animation: up 0.45s cubic-bezier(.22,.68,0,1.2) both; }
        .d1  { animation-delay:.04s }
        .d2  { animation-delay:.08s }
        .d3  { animation-delay:.12s }
        .d4  { animation-delay:.16s }
        .d5  { animation-delay:.20s }
        .d6  { animation-delay:.24s }
        .d7  { animation-delay:.28s }

        .card {
          background: #fff;
          border: 1px solid #ececf0;
          border-radius: 18px;
        }

        .action-btn:hover .action-icon {
          background: var(--accent);
          color: #fff;
          transform: scale(1.07);
        }

        .row-item:hover { background: #f9f9fb; border-color: #e2e2ea; }
      `}</style>

      <div className="dash max-w-6xl mx-auto px-1 pb-12" style={{ '--accent': '#6366f1' } as any}>

        {/* ══ TOP BAR ══════════════════════════════════════════ */}
        <div className="flex items-start justify-between gap-3 mb-6 md:mb-8 up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-medium text-indigo-500 tracking-wide uppercase">Doctor Portal</span>
            </div>
            <h1 className="text-[1.35rem] md:text-[1.6rem] font-semibold text-neutral-900 leading-tight">
              {greeting()},&nbsp;
              <span className="text-indigo-600">Dr. {user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-sm text-neutral-400 mt-0.5">{dateStr}</p>
          </div>

          <button
            onClick={() => navigate('/doctor/notifications')}
            className="relative mt-1 w-10 h-10 rounded-2xl border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition-colors"
          >
            <Bell className="w-4 h-4 text-neutral-600" />
            {unreadNotif > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadNotif}
              </span>
            )}
          </button>
        </div>

        {/* ══ STAT STRIP ═══════════════════════════════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Today", value: todayAppointments.length, sub: 'patients', icon: Users,       color: '#6366f1', bg: '#eef2ff' },
            { label: "Upcoming", value: scheduled,             sub: 'booked',   icon: Clock,       color: '#0ea5e9', bg: '#f0f9ff' },
            { label: "Completed",value: completed,             sub: 'sessions', icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
            { label: "Revenue",  value: `₹${revenue.toLocaleString()}`, sub: 'earned', icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb' },
          ].map((s, i) => (
            <div key={s.label} className={`card p-5 up d${i + 1}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-2">{s.label}</p>
                  <p className="text-[2rem] font-semibold leading-none" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">{s.sub}</p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ MAIN GRID ════════════════════════════════════════ */}
  <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">

          {/* ── LEFT COL ── */}
          <div className="space-y-4">

            {/* Today's Schedule */}
            <div className="card p-4 md:p-6 up d3">
              <div className="flex items-center justify-between gap-2 mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Today's Schedule</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">{todayAppointments.length} appointments</p>
                </div>
                <button
                  onClick={() => navigate('/doctor/appointments')}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
                >
                  View all <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {todayAppointments.length > 0 ? (
                <div className="space-y-2">
                  {todayAppointments.slice(0, 6).map((a) => {
                    const st = STATUS_MAP[a.status] || STATUS_MAP.SCHEDULED
                    return (
                      <div
                        key={a.id}
                        className="row-item flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-neutral-100 transition-all"
                      >
                        {/* avatar + info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}
                          >
                            {avatar(a.patientName)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-800 truncate">{a.patientName}</p>
                            <p className="mono text-[11px] text-neutral-400">{a.startTime?.slice(0, 5)} – {a.endTime?.slice(0, 5)}</p>
                          </div>
                        </div>

                        {/* status + action */}
                        <div className="flex items-center gap-2.5 self-end sm:self-auto">
                          <span className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full ring-1 ${st.pill}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                          {(a.status === 'SCHEDULED' || a.status === 'RESCHEDULED') && (
                            <button
                              onClick={() => handleComplete(a.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-semibold transition-colors"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-4">
                    <Calendar className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-500">No appointments today</p>
                  <p className="text-xs text-neutral-400 mt-1">Your schedule is clear for now.</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 up d4">
              {[
                { icon: Calendar, label: 'Appointments', path: '/doctor/appointments', color: '#6366f1', bg: '#eef2ff' },
                { icon: Clock,    label: 'Availability',  path: '/doctor/availability', color: '#0ea5e9', bg: '#f0f9ff' },
                { icon: FileText, label: 'Prescriptions', path: '/doctor/prescriptions',color: '#10b981', bg: '#ecfdf5' },
                { icon: Video,    label: 'Video Call',    path: '/doctor/book',         color: '#f59e0b', bg: '#fffbeb' },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="action-btn card p-4 flex flex-col items-center gap-3 hover:shadow-sm transition-all"
                  style={{ '--accent': item.color } as any}
                >
                  <div
                    className="action-icon w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200"
                    style={{ background: item.bg, color: item.color }}
                  >
                    <item.icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                  </div>
                  <p className="text-[12px] font-medium text-neutral-600 text-center leading-tight">{item.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── RIGHT COL ── */}
          <div className="space-y-4">

            {/* Revenue hero */}
            <div
              className="rounded-[18px] p-5 text-white up d3 relative overflow-hidden"
              style={{ background: 'linear-gradient(145deg, #312e81 0%, #4f46e5 60%, #6366f1 100%)' }}
            >
              {/* decorative ring */}
              <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full border-[20px] border-white/5" />
              <div className="absolute -right-2 -bottom-8 w-20 h-20 rounded-full border-[12px] border-white/5" />

              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-xs text-indigo-200 font-medium uppercase tracking-wider">This Month</p>
                  <Activity className="w-4 h-4 text-indigo-300" />
                </div>
                <p className="text-[2.2rem] font-semibold leading-none mb-1">₹{revenue.toLocaleString()}</p>
                <p className="text-xs text-indigo-300">{completed} sessions completed</p>
              </div>
            </div>

            {/* Pending Rx */}
            <div className="card p-5 up d4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-neutral-900">Pending Rx</h2>
                {pendingRx.length > 0 && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {pendingRx.length}
                  </span>
                )}
              </div>

              {pendingRx.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-neutral-400 py-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  All caught up — no pending prescriptions
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRx.slice(0, 3).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/60 border border-amber-100">
                      <div className="w-8 h-8 rounded-xl bg-amber-200/60 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {avatar(a.patientName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-neutral-700 truncate">{a.patientName}</p>
                        <p className="mono text-[10px] text-neutral-400">
                          {new Date(a.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="card p-5 up d5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-neutral-900">Updates</h2>
                <button
                  onClick={() => navigate('/doctor/notifications')}
                  className="text-[11px] text-indigo-500 font-medium hover:text-indigo-700 transition-colors"
                >
                  See all
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">No new updates</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex gap-3 items-start">
                      <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 transition-transform ${n.isRead ? 'bg-neutral-200' : 'bg-indigo-500 scale-110'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${n.isRead ? 'text-neutral-500' : 'text-neutral-800'}`}>{n.title}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}