import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

type PendingRequest = {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

let isRefreshing = false
let pendingRequests: PendingRequest[] = []
let hasShownSessionExpiredMessage = false

const processPendingRequests = (error: unknown, token: string | null = null) => {
  pendingRequests.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
      return
    }
    if (token) {
      resolve(token)
    }
  })
  pendingRequests = []
}

const forceLogout = (showMessage = true) => {
  useAuthStore.getState().logout()

  if (showMessage && !hasShownSessionExpiredMessage) {
    toast.error('Your session has expired. Please log in again.')
    hasShownSessionExpiredMessage = true
  }

  if (!window.location.pathname.startsWith('/login')) {
    window.location.href = '/login'
  }
}

const shouldSuppressErrorToast = (error: any) => {
  const status = error.response?.status
  const message = String(
    error.response?.data?.error ||
    error.response?.data?.message ||
    ''
  ).toLowerCase()

  if (status === 401) return true
  if (status === 404 && message.includes('profile not found')) return true
  return false
}

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: attach JWT ─────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response interceptor: handle 401, show errors ──────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any
    const status = error.response?.status
    const requestUrl = String(originalRequest?.url || '')
    const isAuthEndpoint = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/refresh')
    const skipAuthRefresh = Boolean(originalRequest?.skipAuthRefresh)

    if (status === 401 && !isAuthEndpoint && !skipAuthRefresh) {
      const refreshToken = useAuthStore.getState().refreshToken

      if (!refreshToken) {
        forceLogout()
        return Promise.reject(error)
      }

      if (originalRequest?._retry) {
        forceLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({
            resolve: (token: string) => {
              originalRequest._retry = true
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/auth/refresh', null, {
          params: { refreshToken },
        })
        const newToken = data.data.accessToken
        const user = useAuthStore.getState().user

        if (!user || !newToken) {
          throw new Error('Invalid auth state during token refresh')
        }

        hasShownSessionExpiredMessage = false
        useAuthStore.getState().setAuth(user, newToken, refreshToken)
        processPendingRequests(null, newToken)

        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processPendingRequests(refreshError, null)
        forceLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'Something went wrong. Please try again.'

    if (!shouldSuppressErrorToast(error)) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)

export default api

// ─── Typed API functions ─────────────────────────────────────────────────────

export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout', null, { skipAuthRefresh: true } as any),
  refresh: (token: string) => api.post('/auth/refresh', null, { params: { refreshToken: token } }),
}

export const doctorApi = {
  getAll: () => api.get('/doctors'),
  getById: (id: number) => api.get(`/doctors/${id}`),
  search: (params: any) => api.get('/doctors/search', { params }),
  getSpecializations: () => api.get('/doctors/specializations'),
  getSlots: (id: number, date: string) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  getMyProfile: () => api.get('/doctor/profile'),
  updateProfile: (data: any) => api.post('/doctor/profile', data),
  setAvailability: (data: any) => api.post('/doctor/availability', data),
  toggleAvailability: () => api.patch('/doctor/toggle-availability'),
}

export const appointmentApi = {
  book: (data: any) => api.post('/appointments', data),
  getMy: () => api.get('/appointments/my'),
  getById: (id: number) => api.get(`/appointments/${id}`),
  getByDate: (date: string) => api.get('/appointments/doctor/today', { params: { date } }),
  cancel: (id: number) => api.delete(`/appointments/${id}/cancel`),
  reschedule: (id: number, data: any) => api.put(`/appointments/${id}/reschedule`, data),
  complete: (id: number, doctorNotes: string) =>
    api.patch(`/appointments/${id}/complete`, { doctorNotes }),
}

export const prescriptionApi = {
  add: (data: any) => api.post('/prescriptions', data),
  getMy: () => api.get('/prescriptions/my'),
  getById: (id: number) => api.get(`/prescriptions/${id}`),
  getByAppointment: (id: number) => api.get(`/prescriptions/appointment/${id}`),
  downloadPdf: (id: number) => api.get(`/prescriptions/${id}/download`, { responseType: 'blob' }),
}

export const paymentApi = {
  createOrder: (appointmentId: number) => api.post(`/payments/create-order/${appointmentId}`),
  verify: (data: any) => api.post('/payments/verify', data),
}

export const notificationApi = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
}

export const symptomApi = {
  suggest: (symptoms: string) => api.post('/symptoms/suggest', { symptoms }),
}

export const patientApi = {
  getProfile: () => api.get('/patient/profile'),
  updateProfile: (data: any) => api.post('/patient/profile', data),
  rate: (data: any) => api.post('/patient/rate', data),
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllDoctors: () => api.get('/admin/doctors'),
  getAllPatients: () => api.get('/admin/patients'),
  getAllUsers: () => api.get('/admin/users'),
  deactivateUser: (id: number) => api.delete(`/admin/users/${id}`),
  activateUser: (id: number) => api.patch(`/admin/users/${id}/activate`),
  getAuditLogs: (page = 0) => api.get('/admin/audit-logs', { params: { page } }),
}
