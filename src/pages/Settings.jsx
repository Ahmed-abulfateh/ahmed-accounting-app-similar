import { useState } from 'react'
import useStore from '../store/useStore'
import PageHeader from '../components/ui/PageHeader'
import { Save, Building2, ShieldCheck, KeyRound } from 'lucide-react'

export default function Settings() {
  const company       = useStore((s) => s.company)
  const appSettings   = useStore((s) => s.appSettings)
  const updateCompany = useStore((s) => s.updateCompany)
  const updateAppSettings = useStore((s) => s.updateAppSettings)

  const [companyForm, setCompanyForm]   = useState(company)
  const [securityForm, setSecurityForm] = useState(appSettings.auth)
  const [saved, setSaved] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    updateCompany(companyForm)
    updateAppSettings({ auth: securityForm })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title="Settings" subtitle="Manage your company and application preferences" />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Building2 size={22} className="text-cyan-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Company Information</h2>
              <p className="text-sm text-gray-500">Update your company profile details</p>
            </div>
          </div>

          <div className="space-y-4">
          <div>
            <label className="form-label">Company Name *</label>
            <input className="form-input" required value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Currency</label>
              <select className="form-select" value={companyForm.currency} onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}>
                {['USD','EUR','GBP','BHD','SAR','AED','EGP','CAD','AUD'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Fiscal Year Start</label>
              <select className="form-select" value={companyForm.fiscalYear} onChange={(e) => setCompanyForm({ ...companyForm, fiscalYear: e.target.value })}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
          </div>

          <div>
            <label className="form-label">Phone</label>
            <input className="form-input" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
          </div>

          <div>
            <label className="form-label">Address</label>
            <textarea className="form-input" rows={2} value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} />
          </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShieldCheck size={22} className="text-emerald-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Security and Authentication</h2>
              <p className="text-sm text-gray-500">Prepare policy defaults for role-based auth integration</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="pr-3">
                <p className="font-semibold text-slate-800">Require Two-Factor Authentication</p>
                <p className="text-xs text-slate-500 mt-0.5">Applied once user accounts and login are connected</p>
              </div>
              <input
                type="checkbox"
                checked={securityForm.requireTwoFactor}
                onChange={(e) => setSecurityForm({ ...securityForm, requireTwoFactor: e.target.checked })}
                className="h-4 w-4 accent-emerald-600"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Session Timeout (minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="240"
                  className="form-input"
                  value={securityForm.sessionTimeoutMinutes}
                  onChange={(e) => setSecurityForm({ ...securityForm, sessionTimeoutMinutes: Number(e.target.value || 0) })}
                />
              </div>
              <div>
                <label className="form-label">Max Failed Login Attempts</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  className="form-input"
                  value={securityForm.failedAttemptsLimit}
                  onChange={(e) => setSecurityForm({ ...securityForm, failedAttemptsLimit: Number(e.target.value || 0) })}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <KeyRound size={16} className="text-slate-600" />
                <p className="font-semibold text-slate-800">Password Policy</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Minimum Length</label>
                  <input
                    type="number"
                    min="8"
                    max="64"
                    className="form-input"
                    value={securityForm.passwordMinLength}
                    onChange={(e) => setSecurityForm({ ...securityForm, passwordMinLength: Number(e.target.value || 0) })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 mt-8 sm:mt-0">
                  <input
                    type="checkbox"
                    checked={securityForm.passwordRequireNumbers}
                    onChange={(e) => setSecurityForm({ ...securityForm, passwordRequireNumbers: e.target.checked })}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Require numbers
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={securityForm.passwordRequireSymbols}
                    onChange={(e) => setSecurityForm({ ...securityForm, passwordRequireSymbols: e.target.checked })}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  Require symbols
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className={`btn ${saved ? 'btn-success' : 'btn-primary'}`}>
            <Save size={16} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
