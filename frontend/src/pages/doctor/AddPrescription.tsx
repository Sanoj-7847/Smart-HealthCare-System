import { useState, useEffect } from 'react'
import { prescriptionApi, appointmentApi } from '../../api'
import { PageHeader, LoadingSpinner, AppointmentCard, EmptyState } from '../../components/common'
import { Plus, Trash2, Save, FileText, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const blankMed = () => ({ medicineName:'',dosage:'',frequency:'',duration:'',instructions:'',type:'Tablet' })
const MED_TYPES = ['Tablet','Capsule','Syrup','Injection','Cream','Drops','Inhaler','Powder']
const FREQS = ['Once a day','Twice a day','Thrice a day','Before meals','After meals','At bedtime','As needed']

export default function AddPrescription() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAppt, setSelectedAppt] = useState<any>(null)
  const [diagnosis, setDiagnosis] = useState('')
  const [medicines, setMedicines] = useState([blankMed()])
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    appointmentApi.getMy().then(r => {
      // Only show completed appointments without prescriptions
      const completed = (r.data.data || []).filter((a: any) => a.status === 'COMPLETED' && !a.hasPrescription)
      setAppointments(completed)
    }).finally(() => setLoading(false))
  }, [])

  const updateMed = (i: number, k: string, v: string) =>
    setMedicines(m => m.map((med, idx) => idx === i ? { ...med, [k]: v } : med))

  const handleSubmit = async () => {
    if (!selectedAppt) { toast.error('Select an appointment'); return }
    if (!diagnosis.trim()) { toast.error('Diagnosis required'); return }
    setSaving(true)
    try {
      await prescriptionApi.add({
        appointmentId: selectedAppt.id,
        diagnosis, medicines: medicines.filter(m => m.medicineName.trim()),
        additionalNotes, followUpDate: followUpDate || null
      })
      toast.success('Prescription added successfully!')
      setSelectedAppt(null); setDiagnosis(''); setMedicines([blankMed()]); setAdditionalNotes(''); setFollowUpDate('')
      // Refresh list
      appointmentApi.getMy().then(r => setAppointments((r.data.data||[]).filter((a:any)=>a.status==='COMPLETED'&&!a.hasPrescription)))
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      <PageHeader title="Write Prescription" subtitle="Add prescriptions for completed appointments"/>

      {!selectedAppt ? (
        <div>
          <p className="text-sm font-medium text-slate-600 mb-3">Select a completed appointment:</p>
          {appointments.length === 0
            ? <EmptyState icon={CheckCircle} title="No pending prescriptions" subtitle="All completed appointments have prescriptions."/>
            : <div className="space-y-3">
                {appointments.map(a => (
                  <div key={a.id} onClick={() => setSelectedAppt(a)} className="cursor-pointer hover:ring-2 hover:ring-emerald-400 rounded-xl transition-all">
                    <AppointmentCard appointment={a} role="DOCTOR" actions={
                      <button className="btn-primary text-xs py-1.5 px-3"><FileText className="w-3 h-3"/>Write Rx</button>
                    }/>
                  </div>
                ))}
              </div>
          }
        </div>
      ) : (
        <div className="w-full space-y-5">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <p className="text-sm text-emerald-800 font-medium">Writing for: <strong>{selectedAppt.patientName}</strong> — {selectedAppt.appointmentDate}</p>
            <button onClick={()=>setSelectedAppt(null)} className="text-xs text-emerald-600 underline">Change</button>
          </div>

          <div className="card space-y-5">
            <div>
              <label className="label">Diagnosis *</label>
              <textarea value={diagnosis} onChange={e=>setDiagnosis(e.target.value)} rows={2} className="input resize-none" placeholder="Enter primary diagnosis…"/>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="label mb-0">Medicines</label>
                <button onClick={()=>setMedicines(m=>[...m,blankMed()])} className="btn-secondary text-xs py-1.5 px-3">
                  <Plus className="w-3 h-3"/>Add Medicine
                </button>
              </div>
              <div className="space-y-4">
                {medicines.map((med,i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Medicine {i+1}</span>
                      {medicines.length > 1 && <button onClick={()=>setMedicines(m=>m.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div><label className="label text-xs">Name *</label><input value={med.medicineName} onChange={e=>updateMed(i,'medicineName',e.target.value)} className="input" placeholder="e.g. Paracetamol"/></div>
                      <div><label className="label text-xs">Type</label><select value={med.type} onChange={e=>updateMed(i,'type',e.target.value)} className="input">{MED_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                      <div><label className="label text-xs">Dosage</label><input value={med.dosage} onChange={e=>updateMed(i,'dosage',e.target.value)} className="input" placeholder="500mg"/></div>
                      <div><label className="label text-xs">Frequency</label><select value={med.frequency} onChange={e=>updateMed(i,'frequency',e.target.value)} className="input"><option value="">Select…</option>{FREQS.map(f=><option key={f}>{f}</option>)}</select></div>
                      <div><label className="label text-xs">Duration</label><input value={med.duration} onChange={e=>updateMed(i,'duration',e.target.value)} className="input" placeholder="5 days"/></div>
                      <div><label className="label text-xs">Instructions</label><input value={med.instructions} onChange={e=>updateMed(i,'instructions',e.target.value)} className="input" placeholder="After meals"/></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div><label className="label">Additional Notes</label><textarea value={additionalNotes} onChange={e=>setAdditionalNotes(e.target.value)} rows={2} className="input resize-none" placeholder="Rest advice, diet instructions…"/></div>
            <div><label className="label">Follow-up Date</label><input type="date" value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input sm:max-w-xs"/></div>
            <div className="flex gap-3 pt-2">
              <button onClick={()=>setSelectedAppt(null)} className="btn-secondary">Back</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1">
                <Save className="w-4 h-4"/>{saving?'Saving…':'Save Prescription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
