import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/ui/PageHeader'
import { Save, Building2 } from 'lucide-react'

export default function Settings() {
  const company       = useStore((s) => s.company)
  const updateCompany = useStore((s) => s.updateCompany)

  const [form, setForm]   = useState(company)
  const [saved, setSaved] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    updateCompany(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your company and application preferences" />

      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <Building2 size={22} className="text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Company Information</h2>
            <p className="text-sm text-gray-500">Update your company profile details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Company Name *</label>
            <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {['USD','EUR','GBP','BHD','SAR','AED','EGP','CAD','AUD'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Fiscal Year Start</label>
              <select className="form-select" value={form.fiscalYear} onChange={(e) => setForm({ ...form, fiscalYear: e.target.value })}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>

          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>

          <div>
            <label className="form-label">Address</label>
            <textarea className="form-input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}>
              <Save size={16} />
              {saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
