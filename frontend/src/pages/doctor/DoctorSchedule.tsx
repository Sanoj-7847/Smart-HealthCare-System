import { useEffect, useState } from 'react'
import { doctorApi } from '../../api'
import { PageHeader, LoadingSpinner } from '../../components/common'
import { Clock, Save, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
const DAY_LABELS: Record<string,string> = { MONDAY:'Mon',TUESDAY:'Tue',WEDNESDAY:'Wed',THURSDAY:'Thu',FRIDAY:'Fri',SATURDAY:'Sat',SUNDAY:'Sun' }

interface DaySchedule { dayOfWeek: string; isAvailable: boolean; startTime: string; endTime: string; breakStart: string; breakEnd: string }
const blank = (day: string): DaySchedule => ({ dayOfWeek: day, isAvailable: false, startTime: '09:00', endTime: '17:00', breakStart: '', breakEnd: '' })

export default function DoctorSchedule() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DAYS.map(blank))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [docAvailable, setDocAvailable] = useState(true)

  useEffect(() => {
    Promise.all([doctorApi.getMyProfile()]).then(([res]) => {
      const avails: any[] = res.data.data?.availabilities || []
      setDocAvailable(res.data.data?.isAvailable ?? true)
      setSchedule(DAYS.map(day => {
        const existing = avails.find((a: any) => a.dayOfWeek === day)
        return existing ? {
          dayOfWeek: day,
          isAvailable: existing.isAvailable ?? false,
          startTime: existing.startTime?.slice(0,5) || '09:00',
          endTime: existing.endTime?.slice(0,5) || '17:00',
          breakStart: existing.breakStart?.slice(0,5) || '',
          breakEnd: existing.breakEnd?.slice(0,5) || '',
        } : blank(day)
      }))
    }).finally(() => setLoading(false))
  }, [])

  const update = (i: number, field: keyof DaySchedule, value: any) =>
    setSchedule(s => s.map((d, idx) => idx === i ? { ...d, [field]: value } : d))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = schedule.filter(d => d.isAvailable).map(d => ({
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime + ':00',
        endTime: d.endTime + ':00',
        isAvailable: true,
        breakStart: d.breakStart ? d.breakStart + ':00' : null,
        breakEnd: d.breakEnd ? d.breakEnd + ':00' : null,
      }))
      await doctorApi.setAvailability(payload)
      toast.success('Schedule saved!')
    } finally { setSaving(false) }
  }

  const handleToggle = async () => {
    try {
      await doctorApi.toggleAvailability()
      setDocAvailable(p => !p)
      toast.success(docAvailable ? 'You are now offline' : 'You are now available')
    } catch {}
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="My Schedule" subtitle="Set your weekly availability for patient bookings" action={
        <div className="flex gap-3">
          <button onClick={handleToggle} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm border transition-all ${docAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {docAvailable ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
            {docAvailable ? 'Available' : 'Unavailable'}
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save className="w-4 h-4"/>{saving ? 'Saving...' : 'Save Schedule'}
          </button>
        </div>
      }/>

      <div className="grid gap-3">
        {schedule.map((day, i) => (
          <div key={day.dayOfWeek} className={`card transition-all duration-200 ${day.isAvailable ? 'border-emerald-200 bg-emerald-50/30' : 'opacity-60'}`}>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Toggle */}
              <label className="flex items-center gap-2 cursor-pointer w-28 flex-shrink-0">
                <div className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${day.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`}
                     onClick={() => update(i, 'isAvailable', !day.isAvailable)}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${day.isAvailable ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                </div>
                <span className="font-semibold text-sm text-slate-700">{DAY_LABELS[day.dayOfWeek]}</span>
              </label>

              {day.isAvailable && (
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 flex-shrink-0"/>
                    <input type="time" value={day.startTime} onChange={e => update(i,'startTime',e.target.value)} className="input py-1.5 w-28 text-sm"/>
                    <span className="text-slate-400 text-sm">to</span>
                    <input type="time" value={day.endTime} onChange={e => update(i,'endTime',e.target.value)} className="input py-1.5 w-28 text-sm"/>
                  </div>
                  <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Break:</span>
                    <input type="time" value={day.breakStart} onChange={e => update(i,'breakStart',e.target.value)} className="input py-1.5 w-28 text-sm" placeholder="--:--"/>
                    <span className="text-slate-400 text-sm">–</span>
                    <input type="time" value={day.breakEnd} onChange={e => update(i,'breakEnd',e.target.value)} className="input py-1.5 w-28 text-sm" placeholder="--:--"/>
                  </div>
                </div>
              )}
              {!day.isAvailable && <span className="text-sm text-slate-400 italic">Not working this day</span>}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-2">💡 Slots are auto-generated every 30 minutes within your working hours. Break times are excluded.</p>
    </div>
  )
}
