import { LucideIcon } from 'lucide-react'

// ─── Status Badge ────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase()
  const labels: Record<string, string> = {
    scheduled:   '● Scheduled',
    completed:   '✓ Completed',
    cancelled:   '✕ Cancelled',
    rescheduled: '↻ Rescheduled',
    no_show:     '— No Show',
    paid:        '✓ Paid',
    pending:     '◌ Pending',
    failed:      '✕ Failed',
    refunded:    '↩ Refunded',
  }
  return <span className={`badge badge-${s}`}>{labels[s] || status}</span>
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const px = { sm: 28, md: 44, lg: 60 }[size]
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 0' }}>
      <div style={{
        width: px, height: px, borderRadius: '50%',
        border: '2px solid var(--b2)', borderTopColor: 'var(--cyan)',
        animation: 'spin 0.9s linear infinite',
      }} />
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, subtitle, action }: {
  icon: LucideIcon; title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '4rem 1rem', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 'var(--r3)',
        background: 'var(--s2)', border: '1px solid var(--b1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem',
      }}>
        <Icon style={{ width: 22, height: 22, color: 'var(--t3)' }} />
      </div>
      <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--t1)', marginBottom: '0.25rem' }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--t3)', maxWidth: '26rem' }}>{subtitle}</p>
      )}
      {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
    </div>
  )
}

// ─── Page Header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: {
  title: string; subtitle?: string; action?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
      paddingBottom: '1.25rem', borderBottom: '1px solid var(--b1)',
    }}>
      <div>
        <h1 className="page-header-title">{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
type StatColor = 'cyan' | 'green' | 'amber' | 'red' | 'purple'

const accentMap: Record<StatColor, { accent: string; dim: string }> = {
  cyan:   { accent: '#22d3ee', dim: 'rgba(34,211,238,0.10)' },
  green:  { accent: '#4ade80', dim: 'rgba(74,222,128,0.10)' },
  amber:  { accent: '#fbbf24', dim: 'rgba(251,191,36,0.10)' },
  red:    { accent: '#f87171', dim: 'rgba(248,113,113,0.10)' },
  purple: { accent: '#a78bfa', dim: 'rgba(167,139,250,0.10)' },
}

export function StatCard({ title, value, icon: Icon, color, subtitle, trend }: {
  title: string; value: string | number; icon: LucideIcon
  color: StatColor; subtitle?: string; trend?: { value: number; label: string }
}) {
  const { accent, dim } = accentMap[color] ?? accentMap.cyan
  return (
    <div
      className="dash-stat-card"
      style={{ '--accent': accent, '--dim': dim } as React.CSSProperties}>
      <div className="dsc-top">
        <div className="dsc-icon-wrap"><Icon size={16} /></div>
        <span className="dsc-label">{title}</span>
      </div>
      <div className="dsc-value">{value}</div>
      {subtitle && <div className="dsc-sub">{subtitle}</div>}
      {trend && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          marginTop: '0.375rem', fontSize: '0.6875rem', fontWeight: 600,
          color: trend.value >= 0 ? 'var(--green)' : 'var(--red)',
        }}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          <span style={{ color: 'var(--t3)', fontWeight: 400 }}>{trend.label}</span>
        </div>
      )}
      <div className="dsc-line" />
    </div>
  )
}

// ─── Doctor Card ─────────────────────────────────────────────────────────────
export function DoctorCard({ doctor, action }: { doctor: any; action?: React.ReactNode }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
        <div className="doctor-card-av">{doctor.name?.charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--t1)', letterSpacing: '-0.01em' }}>
                Dr. {doctor.name}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--cyan)', fontWeight: 600, marginTop: '1px' }}>
                {doctor.specialization}
              </p>
            </div>
            {doctor.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                <span style={{ color: 'var(--amber)' }}>★</span>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--t1)' }}>
                  {doctor.rating?.toFixed(1)}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--t3)' }}>({doctor.totalRatings})</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.625rem' }}>
            {[
              `🏥 ${doctor.hospital || 'N/A'}`,
              `🎓 ${doctor.experience} yrs`,
              `₹${doctor.consultationFee}`,
              doctor.qualification && `📋 ${doctor.qualification}`,
            ].filter(Boolean).map((item, i) => (
              <span key={i} className="doctor-tag">{item}</span>
            ))}
          </div>
          {doctor.bio && (
            <p style={{
              fontSize: '0.75rem', color: 'var(--t3)', marginTop: '0.5rem', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{doctor.bio}</p>
          )}
          {action && <div style={{ marginTop: '0.875rem' }}>{action}</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Appointment Card ────────────────────────────────────────────────────────
export function AppointmentCard({ appointment, actions, role }: {
  appointment: any; actions?: React.ReactNode; role?: string
}) {
  const date = new Date(appointment.appointmentDate)
  const dateStr = date.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
  return (
    <div className="card">
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: '0.75rem', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div className="appt-date-chip">
            <span className="appt-date-d">{date.toLocaleDateString('en-IN', { day: 'numeric' })}</span>
            <span className="appt-date-m">{date.toLocaleDateString('en-IN', { month: 'short' })}</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--t1)' }}>
                {role === 'DOCTOR' ? appointment.patientName : `Dr. ${appointment.doctorName}`}
              </h3>
              <StatusBadge status={appointment.status} />
              <StatusBadge status={appointment.paymentStatus} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--t3)', fontFamily: 'Geist Mono, monospace' }}>
              {role !== 'DOCTOR' && (
                <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>
                  {appointment.doctorSpecialization} ·{' '}
                </span>
              )}
              {dateStr} · {appointment.startTime?.slice(0,5)} – {appointment.endTime?.slice(0,5)}
            </p>
            {appointment.reason && (
              <p style={{ fontSize: '0.75rem', color: 'var(--t3)', marginTop: '0.25rem' }}>
                📋 {appointment.reason}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>{actions}</div>
        )}
      </div>
    </div>
  )
}