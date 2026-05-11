import { useState } from 'react'
import useStore from '../../store/useStore'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { fmt, fmtDate } from '../../utils/format'
import { Plus, Pencil, Trash2, Search, Mail, Phone } from 'lucide-react'

const emptyForm = { name: '', email: '', phone: '', address: '' }

export default function CustomersList() {
  const customers      = useStore((s) => s.customers)
  const invoices       = useStore((s) => s.invoices)
  const addCustomer    = useStore((s) => s.addCustomer)
  const updateCustomer = useStore((s) => s.updateCustomer)
  const deleteCustomer = useStore((s) => s.deleteCustomer)

  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [search, setSearch]   = useState('')

  const customerBalance = (id) => invoices.filter(i => i.customerId === id && i.status !== 'paid').reduce((a, b) => a + b.total, 0)
  const invoiceCount = (id) => invoices.filter(i => i.customerId === id).length

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setModal('form') }
  const openEdit = (c) => { setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address }); setEditing(c.id); setModal('form') }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateCustomer(editing, form)
    else addCustomer(form)
    setModal(null)
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Customers"
        subtitle="Manage your customer contacts"
        actions={<button className="btn-primary" onClick={openAdd}><Plus size={16} /> New Customer</button>}
      />

      <div className="flex gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="form-input pl-9 w-64" placeholder="Search customers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg mb-2">
                  {c.name[0]}
                </div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Since {fmtDate(c.createdAt)}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                <button onClick={() => deleteCustomer(c.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-sm text-gray-500">
              {c.email && <div className="flex items-center gap-2"><Mail size={13} /><span>{c.email}</span></div>}
              {c.phone && <div className="flex items-center gap-2"><Phone size={13} /><span>{c.phone}</span></div>}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
              <span className="text-gray-500">{invoiceCount(c.id)} invoices</span>
              <span className={`font-semibold ${customerBalance(c.id) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {fmt(customerBalance(c.id))} outstanding
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-3 text-center text-gray-400 py-10">No customers found</p>
        )}
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Edit Customer' : 'New Customer'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Name *</label>
              <input className="form-input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company or person name" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="billing@example.com" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1-555-0000" />
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-input" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Customer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
