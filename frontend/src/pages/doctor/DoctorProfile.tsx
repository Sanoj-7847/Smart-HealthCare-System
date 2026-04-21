import { useEffect, useState } from 'react'
import { doctorApi } from '../../api'
import { PageHeader, LoadingSpinner } from '../../components/common'
import { Save, Stethoscope } from 'lucide-react'
import toast from 'react-hot-toast'

const SPECIALIZATIONS = ['Cardiology','Neurology','General Medicine','Dermatology','Orthopedics',
  'Gastroenterology','Ophthalmology','ENT','Endocrinology','Psychiatry',
  'Gynecology','Urology','Pediatrics','Oncology','Dentistry','Pulmonology']

export default function DoctorProfile() {
  const [form, setForm] = useState({ specialization:'',experience:'',consultationFee:'',bio:'',qualification:'',hospital:'',slotDuration:'30' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    doctorApi.getMyProfile().then(r => {
      const d = r.data.data
      if (d) setForm({ specialization:d.specialization||'', experience:d.experience||'', consultationFee:d.consultationFee||'', bio:d.bio||'', qualification:d.qualification||'', hospital:d.hospital||'', slotDuration:d.slotDuration||'30' })
    }).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const u = (k: string, v: string) => setForm(f=>({...f,[k]:v}))

  const handleSave = async () => {
    if (!form.specialization || !form.experience || !form.consultationFee) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      await doctorApi.updateProfile({ ...form, experience: parseInt(form.experience), consultationFee: parseFloat(form.consultationFee), slotDuration: parseInt(form.slotDuration) })
      toast.success('Profile updated!')
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />
  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Profile" subtitle="Update your professional information"/>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] items-start">
        <div className="card space-y-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
            <Stethoscope className="w-7 h-7 text-white"/>
          </div>
          <div>
            <p className="font-semibold text-slate-800">Professional Details</p>
            <p className="text-sm text-slate-500">Keep these details accurate for better patient trust and booking quality.</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm text-emerald-800">
            Fields marked * are required.
          </div>
        </div>

        <div className="card space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Specialization *</label>
              <select value={form.specialization} onChange={e=>u('specialization',e.target.value)} className="input">
                <option value="">Select specialization</option>
                {SPECIALIZATIONS.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Experience (years) *</label>
              <input type="number" min="0" max="60" value={form.experience} onChange={e=>u('experience',e.target.value)} className="input" placeholder="e.g. 5"/>
            </div>
            <div>
              <label className="label">Consultation Fee (₹) *</label>
              <input type="number" min="0" value={form.consultationFee} onChange={e=>u('consultationFee',e.target.value)} className="input" placeholder="e.g. 500"/>
            </div>
            <div>
              <label className="label">Qualification</label>
              <input value={form.qualification} onChange={e=>u('qualification',e.target.value)} className="input" placeholder="MBBS, MD, etc."/>
            </div>
            <div>
              <label className="label">Hospital / Clinic</label>
              <input value={form.hospital} onChange={e=>u('hospital',e.target.value)} className="input" placeholder="Hospital name"/>
            </div>
            <div>
              <label className="label">Slot Duration (minutes)</label>
              <select value={form.slotDuration} onChange={e=>u('slotDuration',e.target.value)} className="input">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Bio / About</label>
              <textarea value={form.bio} onChange={e=>u('bio',e.target.value)} rows={3} className="input resize-none" placeholder="Write a short professional bio..."/>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary min-w-36">
              <Save className="w-4 h-4"/>{saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
