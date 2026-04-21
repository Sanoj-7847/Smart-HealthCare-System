import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlarmClock,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  HeartPulse,
  Pill,
  Plus,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Syringe,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { appointmentApi, notificationApi, prescriptionApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import './patient-dashboard.css'

type Appointment = {
  id: number
  doctorName?: string
  doctorSpecialization?: string
  appointmentDate: string
  startTime?: string
  endTime?: string
  status: string
  reason?: string
}

type Notification = {
  id: number
  title?: string
  message?: string
  createdAt: string
  isRead?: boolean
}

type PrescriptionMedicine = {
  id?: number
  medicineName?: string
  dosage?: string
  frequency?: string
  duration?: string
}

type Prescription = {
  id: number
  doctorName?: string
  createdAt?: string
  medicines?: PrescriptionMedicine[]
}

type DashboardStats = {
  upcoming: number
  completed: number
  prescriptions: number
  unread: number
}

type DoseSlot = {
  id: string
  medicineName: string
  dosage: string
  timeLabel: string
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatRelative(date: string): string {
  const diffDays = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `${diffDays} days`
  return `${Math.ceil(diffDays / 7)} weeks`
}

function doseCountFromFrequency(frequency: string): number {
  const text = frequency.toLowerCase()
  if (/three|thrice|3\s*x|tid/.test(text)) return 3
  if (/twice|2\s*x|bid/.test(text)) return 2
  if (/four|4\s*x|qid/.test(text)) return 4
  return 1
}

function buildDoseSlots(
  medicines: Array<{
    key: string
    medicineName: string
    dosage: string
    frequency: string
  }>,
): DoseSlot[] {
  const defaultTimes = ['8:00 AM', '1:00 PM', '8:00 PM', '10:00 PM']
  const slots: DoseSlot[] = []

  for (const med of medicines.slice(0, 5)) {
    const count = doseCountFromFrequency(med.frequency)
    for (let i = 0; i < count; i += 1) {
      slots.push({
        id: `${med.key}-${i}`,
        medicineName: med.medicineName,
        dosage: med.dosage,
        timeLabel: defaultTimes[i % defaultTimes.length],
      })
    }
  }

  return slots.slice(0, 8)
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [doseTaken, setDoseTaken] = useState<Record<string, boolean>>({})

  const firstName = user?.name?.split(/\s+/)[0] || 'Patient'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const loadDashboard = async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const [appointmentRes, notificationRes, prescriptionRes] = await Promise.all([
        appointmentApi.getMy(),
        notificationApi.getAll(),
        prescriptionApi.getMy(),
      ])

      setAppointments((appointmentRes.data?.data as Appointment[]) || [])
      setNotifications((notificationRes.data?.data as Notification[]) || [])
      setPrescriptions((prescriptionRes.data?.data as Prescription[]) || [])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const upcomingAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'SCHEDULED' || a.status === 'RESCHEDULED'),
    [appointments],
  )

  const completedAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'COMPLETED'),
    [appointments],
  )

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications],
  )

  const nextAppointment = useMemo(() => {
    return [...upcomingAppointments].sort(
      (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime(),
    )[0]
  }, [upcomingAppointments])

  const medicines = useMemo(() => {
    const list: Array<{
      key: string
      medicineName: string
      dosage: string
      frequency: string
      prescribedBy: string
    }> = []

    const sorted = [...prescriptions].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
    )

    for (const prescription of sorted) {
      for (const medicine of prescription.medicines || []) {
        list.push({
          key: `${prescription.id}-${medicine.id ?? medicine.medicineName ?? 'rx'}`,
          medicineName: medicine.medicineName || 'Medication',
          dosage: medicine.dosage || 'As advised',
          frequency: medicine.frequency || 'Daily',
          prescribedBy: prescription.doctorName ? `Dr. ${prescription.doctorName}` : 'Care team',
        })
      }
    }

    return list
  }, [prescriptions])

  const doseSlots = useMemo(() => {
    const mapped = buildDoseSlots(medicines)
    if (mapped.length > 0) return mapped
    return [
      { id: 'mock-1', medicineName: 'Paracetamol', dosage: '500 mg', timeLabel: '8:00 AM' },
      { id: 'mock-2', medicineName: 'Vitamin D3', dosage: '1000 IU', timeLabel: '8:00 PM' },
    ]
  }, [medicines])

  const dosesTaken = doseSlots.filter((slot) => doseTaken[slot.id]).length
  const adherenceRate = doseSlots.length > 0 ? Math.round((dosesTaken / doseSlots.length) * 100) : 0

  const adherenceLabel =
    adherenceRate >= 80 ? 'Excellent' : adherenceRate >= 50 ? 'On track' : 'Needs attention'

  const stats: DashboardStats = {
    upcoming: upcomingAppointments.length,
    completed: completedAppointments.length,
    prescriptions: medicines.length,
    unread: unreadNotifications.length,
  }

  if (loading) {
    return (
      <div className="patient-dashboard-loading">
        <div className="patient-loader" />
      </div>
    )
  }

  return (
    <div className="patient-dashboard-page">
      <motion.section
        className="patient-hero"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <div className="patient-hero-glow patient-hero-glow-left" />
        <div className="patient-hero-glow patient-hero-glow-right" />
        <div className="patient-hero-top">
          <p className="patient-date">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <motion.button
            type="button"
            className={`patient-refresh-btn ${refreshing ? 'is-spinning' : ''}`}
            onClick={() => void loadDashboard(true)}
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles size={15} />
            Refresh
          </motion.button>
        </div>

        <div className="patient-hero-main">
          <div>
            <h1>
              {greeting}, {firstName}
            </h1>
            <p>
              Keep track of your appointments, medications, and care updates from one clean dashboard.
            </p>
          </div>

          <div className="patient-hero-actions">
            <motion.button
              type="button"
              className="btn-primary"
              onClick={() => navigate('/patient/book')}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <Plus size={15} />
              Book Appointment
            </motion.button>
            <motion.button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/patient/doctors')}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <Stethoscope size={15} />
              Find Doctor
            </motion.button>
            <motion.button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/patient/symptom-checker')}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
            >
              <Syringe size={15} />
              Symptom Checker
            </motion.button>
          </div>
        </div>

        <div className="patient-kpi-row">
          <article>
            <span>Upcoming</span>
            <strong>{stats.upcoming}</strong>
            <small>scheduled visits</small>
          </article>
          <article>
            <span>Completed</span>
            <strong>{stats.completed}</strong>
            <small>past consultations</small>
          </article>
          <article>
            <span>Active Medications</span>
            <strong>{stats.prescriptions}</strong>
            <small>prescribed items</small>
          </article>
          <article>
            <span>Unread Alerts</span>
            <strong>{stats.unread}</strong>
            <small>need your attention</small>
          </article>
        </div>
      </motion.section>

      <section className="patient-main-grid">
        <article className="card card-next-appointment">
          <header className="card-header">
            <div>
              <h2>Next Appointment</h2>
              <p>Your next confirmed consultation</p>
            </div>
            <button type="button" onClick={() => navigate('/patient/appointments')}>
              See all
            </button>
          </header>

          {nextAppointment ? (
            <div className="next-appt-body">
              <div className="doctor-pill">
                <div className="doctor-avatar">
                  <UserRound size={18} />
                </div>
                <div>
                  <h3>Dr. {nextAppointment.doctorName || 'Assigned Doctor'}</h3>
                  <p>{nextAppointment.doctorSpecialization || 'General Consultation'}</p>
                </div>
                <span className="relative-badge">{formatRelative(nextAppointment.appointmentDate)}</span>
              </div>

              <div className="appointment-meta">
                <span>
                  <CalendarDays size={14} />
                  {formatDate(nextAppointment.appointmentDate)}
                </span>
                <span>
                  <Clock3 size={14} />
                  {nextAppointment.startTime?.slice(0, 5) || '--:--'} - {nextAppointment.endTime?.slice(0, 5) || '--:--'}
                </span>
              </div>

              {nextAppointment.reason && (
                <div className="appointment-reason">
                  <FileText size={14} />
                  {nextAppointment.reason}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state compact">
              <CalendarClock size={20} />
              <p>No upcoming appointments</p>
              <button type="button" className="btn-primary" onClick={() => navigate('/patient/book')}>
                Book now
              </button>
            </div>
          )}
        </article>

        <article className="card card-appointments-list">
          <header className="card-header">
            <div>
              <h2>My Appointments</h2>
              <p>Recent and upcoming timeline</p>
            </div>
          </header>

          {appointments.length === 0 ? (
            <div className="empty-state compact">
              <CalendarDays size={20} />
              <p>No appointments available</p>
            </div>
          ) : (
            <ul className="appointment-list">
              {appointments
                .slice()
                .sort(
                  (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime(),
                )
                .slice(0, 6)
                .map((appointment) => (
                  <li
                    key={appointment.id}
                    className="appointment-row"
                    onClick={() => navigate('/patient/appointments')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        navigate('/patient/appointments')
                      }
                    }}
                  >
                    <div>
                      <h4>Dr. {appointment.doctorName || 'Doctor'}</h4>
                      <p>
                        {appointment.doctorSpecialization || 'Consultation'} · {formatDate(appointment.appointmentDate)}
                      </p>
                    </div>
                    <span className={`status status-${appointment.status.toLowerCase()}`}>
                      {appointment.status}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </article>

        <article className="card card-prescriptions">
          <header className="card-header">
            <div>
              <h2>Medication Plan</h2>
              <p>Your latest prescribed medicines</p>
            </div>
            <button type="button" onClick={() => navigate('/patient/prescriptions')}>
              Open
            </button>
          </header>

          {medicines.length === 0 ? (
            <div className="empty-state compact">
              <TriangleAlert size={20} />
              <p>No active medications</p>
            </div>
          ) : (
            <ul className="medication-list">
              {medicines.slice(0, 6).map((medicine) => (
                <li key={medicine.key}>
                  <div>
                    <strong>{medicine.medicineName}</strong>
                    <p>
                      {medicine.frequency} · {medicine.dosage}
                    </p>
                  </div>
                  <small>{medicine.prescribedBy}</small>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="card card-reminder">
          <header className="card-header">
            <div>
              <h2>Medicine Reminder</h2>
              <p>
                {dosesTaken}/{doseSlots.length} doses done today · {adherenceLabel}
              </p>
            </div>
            <div className="pill-badge">
              <AlarmClock size={14} />
              {adherenceRate}%
            </div>
          </header>

          {doseSlots.length === 0 ? (
            <div className="empty-state compact">
              <Pill size={20} />
              <p>No reminders for today</p>
            </div>
          ) : (
            <ul className="reminder-list">
              {doseSlots.slice(0, 6).map((slot) => {
                const isTaken = !!doseTaken[slot.id]
                return (
                  <li key={slot.id} className={isTaken ? 'is-done' : ''}>
                    <div>
                      <strong>{slot.medicineName}</strong>
                      <p>
                        {slot.dosage} · {slot.timeLabel}
                      </p>
                    </div>
                    <motion.button
                      type="button"
                      className={`reminder-toggle ${isTaken ? 'active' : ''}`}
                      onClick={() => {
                        setDoseTaken((prev) => ({ ...prev, [slot.id]: !prev[slot.id] }))
                      }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <Check size={12} />
                    </motion.button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="adherence-progress">
            <span>Daily adherence progress</span>
            <div className="adherence-track">
              <div className="adherence-fill" style={{ width: `${adherenceRate}%` }} />
            </div>
          </div>
        </article>

        <article className="card card-care-overview">
          <header className="card-header">
            <div>
              <h2>Care Overview</h2>
              <p>Patient wellness and task focus</p>
            </div>
          </header>

          <div className="care-overview-grid">
            <div className="care-stat">
              <div className="care-icon care-icon-blue">
                <Activity size={15} />
              </div>
              <div>
                <strong>{appointments.length}</strong>
                <p>Total visits tracked</p>
              </div>
            </div>
            <div className="care-stat">
              <div className="care-icon care-icon-green">
                <ShieldCheck size={15} />
              </div>
              <div>
                <strong>{completedAppointments.length}</strong>
                <p>Consultations completed</p>
              </div>
            </div>
            <div className="care-stat">
              <div className="care-icon care-icon-teal">
                <HeartPulse size={15} />
              </div>
              <div>
                <strong>{doseSlots.length}</strong>
                <p>Reminder slots planned</p>
              </div>
            </div>
          </div>

          <div className="care-next-steps">
            <motion.button
              type="button"
              className="care-step-btn"
              onClick={() => navigate('/patient/appointments')}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <CalendarClock size={14} />
              Review Upcoming Schedule
              <ArrowUpRight size={14} />
            </motion.button>
            <motion.button
              type="button"
              className="care-step-btn"
              onClick={() => navigate('/patient/prescriptions')}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Pill size={14} />
              Open Full Medication Chart
              <ArrowUpRight size={14} />
            </motion.button>
            <motion.button
              type="button"
              className="care-step-btn"
              onClick={() => navigate('/patient/profile')}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserRound size={14} />
              Update Profile And Records
              <ArrowUpRight size={14} />
            </motion.button>
          </div>
        </article>
      </section>
    </div>
  )
}
