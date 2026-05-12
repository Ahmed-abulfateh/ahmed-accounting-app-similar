import { useState } from 'react'
import useStore from '../../store/useStore'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { fmt, fmtDate } from '../../utils/format'
import { Plus, Pencil, Trash2, Search, Mail, Phone } from 'lucide-react'

const emptyForm = { name: '', email: '', phone: '', address: '' }

export default function VendorsList() {
  const vendors      = useStore((s) => s.vendors)
  const bills        = useStore((s) => s.bills)
  const addVendor    = useStore((s) => s.addVendor)
  const updateVendor = useStore((s) => s.updateVendor)
  const deleteVendor = useStore((s) => s.deleteVendor)

  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [search, setSearch]   = useState('')

  const vendorBalance = (id) => bills.filter(b => b.vendorId === id && b.status !== 'paid').reduce((a, b) => a + b.total, 0)
  const billCount = (id) => bills.filter(b => b.vendorId === id).length

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setModal('form') }
  const openEdit = (v) => { setForm({ name: v.name, email: v.email, phone: v.phone, address: v.address }); setEditing(v.id); setModal('form') }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateVendor(editing, form)
    else addVendor(form)
    setModal(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Vendors"
        subtitle="Manage your vendor contacts"
        actions={<button className="btn-primary" onClick={openAdd}><Plus size={16} /> New Vendor</button>}
      />

      <div className="flex gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="form-input pl-9 w-full sm:w-64" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v) => (
          <div key={v.id} className="card p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg mb-2">
                  {v.name[0]}
                </div>
                <h3 className="font-semibold text-gray-900 truncate">{v.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Since {fmtDate(v.createdAt)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(v)} className="btn-small bg-white border border-gray-200 text-gray-400 hover:text-blue-600" aria-label={`Edit ${v.name}`}><Pencil size={14} /></button>
                <button onClick={() => deleteVendor(v.id)} className="btn-small bg-white border border-gray-200 text-gray-400 hover:text-red-600" aria-label={`Delete ${v.name}`}><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-gray-500">
              {v.email && <div className="flex items-center gap-2 min-w-0"><Mail size={13} /><span className="truncate">{v.email}</span></div>}
              {v.phone && <div className="flex items-center gap-2 min-w-0"><Phone size={13} /><span className="truncate">{v.phone}</span></div>}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">{billCount(v.id)} bills</span>
              <span className={`font-semibold ${vendorBalance(v.id) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {fmt(vendorBalance(v.id))} payable
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-3 text-center text-gray-400 py-10">No vendors found</p>
        )}
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Edit Vendor' : 'New Vendor'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Name *</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Vendor'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
