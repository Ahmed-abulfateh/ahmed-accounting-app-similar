import { useState } from 'react'
import useStore from '../../store/useStore'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { fmt } from '../../utils/format'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

const TYPES = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']
const TYPE_COLORS = {
  Asset: 'badge-blue', Liability: 'badge-red', Equity: 'badge-green',
  Revenue: 'badge-green', Expense: 'badge-yellow',
}

const emptyForm = { code: '', name: '', type: 'Asset', normal: 'debit', description: '' }

export default function AccountsList() {
  const accounts      = useStore((s) => s.accounts)
  const addAccount    = useStore((s) => s.addAccount)
  const updateAccount = useStore((s) => s.updateAccount)
  const deleteAccount = useStore((s) => s.deleteAccount)

  const [modal, setModal]   = useState(null) // null | 'add' | 'edit'
  const [editing, setEditing] = useState(null)
  const [form, setForm]     = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')

  const filtered = accounts
    .filter((a) => filterType === 'All' || a.type === filterType)
    .filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.includes(search)
    )

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setModal('form') }
  const openEdit = (a) => { setForm({ code: a.code, name: a.name, type: a.type, normal: a.normal, description: a.description || '' }); setEditing(a.id); setModal('form') }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateAccount(editing, form)
    else addAccount(form)
    setModal(null)
  }

  const groupedByType = TYPES.map((type) => ({
    type,
    rows: filtered.filter((a) => a.type === type),
  })).filter((g) => g.rows.length > 0)

  return (
    <div className="p-8">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage your account structure"
        actions={
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={16} /> New Account
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="form-input pl-9 w-56" placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select w-40" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option>All</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Tables grouped by type */}
      <div className="space-y-6">
        {groupedByType.map(({ type, rows }) => (
          <div key={type} className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 text-sm flex justify-between">
              <span>{type}</span>
              <span className="text-gray-400">{fmt(rows.reduce((a, b) => a + b.balance, 0))}</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="px-5 py-2.5 font-medium">Code</th>
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">Normal</th>
                  <th className="px-5 py-2.5 font-medium text-right">Balance</th>
                  <th className="px-5 py-2.5 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-mono text-gray-500">{a.code}</td>
                    <td className="px-5 py-2.5 font-medium text-gray-900">{a.name}</td>
                    <td className="px-5 py-2.5"><span className="badge badge-gray capitalize">{a.normal}</span></td>
                    <td className="px-5 py-2.5 text-right font-medium">{fmt(a.balance)}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                        <button onClick={() => deleteAccount(a.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <Modal title={editing ? 'Edit Account' : 'New Account'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Code *</label>
                <input className="form-input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. 1010" />
              </div>
              <div>
                <label className="form-label">Type *</label>
                <select className="form-select" required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Account Name *</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Account name" />
            </div>
            <div>
              <label className="form-label">Normal Balance</label>
              <select className="form-select" value={form.normal} onChange={(e) => setForm({ ...form, normal: e.target.value })}>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Account'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
