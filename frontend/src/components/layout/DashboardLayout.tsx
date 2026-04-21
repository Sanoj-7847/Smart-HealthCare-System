import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import { notificationApi, authApi } from '../../api'
import {
  LayoutDashboard, Calendar, User, Bell, LogOut, Menu, X,
  Stethoscope, ClipboardList, Users, Brain, FileText,
  Shield, ScrollText, Search, Clock, Sun, Moon, Heart,
  CalendarPlus, Pill,
  ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import './layout.css'

const navConfig = {
  PATIENT: [
    { to: '/patient/dashboard',       label: 'Dashboard',        icon: LayoutDashboard, section: 'main' },
    { to: '/patient/book',            label: 'Book Appointment', icon: Calendar,        section: 'main' },
    { to: '/patient/appointments',    label: 'My Appointments',  icon: ClipboardList,   section: 'main' },
    { to: '/patient/prescriptions',   label: 'Prescriptions',    icon: FileText,        section: 'main' },
    { to: '/patient/symptom-checker', label: 'Symptom Checker',  icon: Brain,           section: 'tools' },
    { to: '/patient/doctors',         label: 'Find Doctors',     icon: Search,          section: 'tools' },
    { to: '/patient/profile',         label: 'My Profile',       icon: User,            section: 'tools' },
  ],
  DOCTOR: [
    { to: '/doctor/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
    { to: '/doctor/appointments',  label: 'Appointments',  icon: Calendar },
    { to: '/doctor/prescriptions', label: 'Prescriptions', icon: FileText },
    { to: '/doctor/availability',  label: 'Availability',  icon: Clock },
    { to: '/doctor/profile',       label: 'My Profile',    icon: User },
  ],
  ADMIN: [
    { to: '/admin/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
    { to: '/admin/doctors',    label: 'Doctors',    icon: Stethoscope },
    { to: '/admin/patients',   label: 'Patients',   icon: Users },
    { to: '/admin/users',      label: 'All Users',  icon: Shield },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  ],
}

const portalLabels: Record<string, string> = {
  PATIENT: 'Patient Portal',
  DOCTOR:  'Doctor Portal',
  ADMIN:   'Admin Panel',
}

const sectionLabels: Record<string, string> = { main: 'Main', tools: 'Tools & More' }

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const navItems = navConfig[user?.role as keyof typeof navConfig] || []
  const portalLabel = portalLabels[user?.role ?? ''] ?? 'Portal'

  useEffect(() => {
    notificationApi.getUnreadCount()
      .then(res => setUnreadCount(res.data.data.count))
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    toast.success('Signed out')
    navigate('/login')
  }

  type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; section?: string }

  const groupedNav = (navItems as NavItem[]).reduce((acc, item) => {
    const s = item.section || 'main'
    ;(acc[s] ??= []).push(item)
    return acc
  }, {} as Record<string, NavItem[]>)

  const quickLinks = user?.role === 'PATIENT'
    ? [
      { to: '/patient/book', label: 'Book Visit', icon: CalendarPlus },
      { to: '/patient/prescriptions', label: 'Medication Plan', icon: Pill },
    ]
    : []

  const SidebarContent = () => (
    <div className="ls-inner">
      {/* Logo */}
      <div className="ls-logo">
        <div className="ls-logo-mark">
          <Heart size={16} strokeWidth={2.5} />
        </div>
        <div className="ls-logo-text">
          <span className="ls-logo-name">MediCare</span>
          <span className="ls-logo-role">{portalLabel}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="ls-nav">
        {Object.entries(groupedNav).map(([section, items]) => (
          <div key={section} className="ls-section">
            <span className="ls-section-label">{sectionLabels[section] ?? section}</span>
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `ls-link${isActive ? ' active' : ''}`}
              >
                <div className="ls-link-icon">
                  <Icon size={15} strokeWidth={2} />
                </div>
                <span className="ls-link-label">{label}</span>
                <ChevronRight size={12} className="ls-link-arrow" />
              </NavLink>
            ))}
          </div>
        ))}

        {quickLinks.length > 0 && (
          <div className="ls-context-card">
            <div className="ls-context-head">
              <span>Today</span>
              <strong>{unreadCount}</strong>
            </div>
            <p>{unreadCount > 0 ? 'Unread care alerts' : 'No pending alerts'}</p>
            <div className="ls-context-actions">
              {quickLinks.map(({ to, label, icon: Icon }) => (
                <button key={to} type="button" className="ls-context-btn" onClick={() => navigate(to)}>
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* User */}
      <div className="ls-user">
        <div className="ls-user-card">
          <div className="ls-user-av">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ls-user-info">
            <span className="ls-user-name">{user?.name}</span>
            <span className="ls-user-email">{user?.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="ls-signout">
          <LogOut size={13} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="ls-shell">
      {/* Desktop sidebar */}
      <aside className="ls-sidebar ls-sidebar--desktop">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="ls-mobile-wrap">
          <div className="ls-overlay" onClick={() => setSidebarOpen(false)} />
          <aside className="ls-sidebar ls-sidebar--mobile">
            <button className="ls-close" onClick={() => setSidebarOpen(false)}>
              <X size={14} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="ls-main">

        {/* Topbar */}
        <header className="ls-topbar">
          <div className="ls-topbar-left">
            <button className="ls-menu-btn lg-hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={16} />
            </button>
            <div className="ls-breadcrumb">
              <span className="ls-portal-badge">{portalLabel}</span>
            </div>
          </div>

          <div className="ls-topbar-right">
            {/* Theme toggle */}
            <button className="ls-topbar-btn" onClick={toggleTheme} aria-label="Toggle theme">
              <div className="ls-theme-icons">
                {theme === 'dark'
                  ? <Sun size={14} />
                  : <Moon size={14} />
                }
              </div>
            </button>

            {/* Notifications */}
            <button
              className="ls-topbar-btn ls-notif-btn"
              onClick={() => navigate(`/${user?.role?.toLowerCase()}/notifications`)}
            >
              <Bell size={14} />
              {unreadCount > 0 && <span className="ls-notif-pip">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {/* Avatar */}
            <div className="ls-topbar-av">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="ls-page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}