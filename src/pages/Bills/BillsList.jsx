import { useState } from 'react'
import useStore from '../../store/useStore'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { fmt, fmtDate, statusBadge } from '../../utils/format'
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react'

const emptyForm = {
  vendorId: '', date: '', dueDate: '',
  items: [{ description: '', qty: 1, price: 0 }], notes: '',
}

export default function BillsList() {
  const bills      = useStore((s) => s.bills)
  const vendors    = useStore((s) => s.vendors)
  const addBill    = useStore((s) => s.addBill)
  const updateBill = useStore((s) => s.updateBill)
  const deleteBill = useStore((s) => s.deleteBill)

  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [view, setView]       = useState(null)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const vendorName = (id) => vendors.find((v) => v.id === id)?.name ?? '—'
  const calcTotal = (items) => items.reduce((a, it) => a + Number(it.qty) * Number(it.price), 0)

  const filtered = bills
    .filter((b) => statusFilter === 'All' || b.status === statusFilter)
    .filter((b) =>
      b.number.toLowerCase().includes(search.toLowerCase()) ||
      vendorName(b.vendorId).toLowerCase().includes(search.toLowerCase())
    )

  const openAdd = () => { setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] }); setEditing(null); setModal('form') }
  const openEdit = (b) => { setForm({ vendorId: b.vendorId, date: b.date, dueDate: b.dueDate, items: b.items, notes: b.notes }); setEditing(b.id); setModal('form') }

  const setItem = (i, key, val) => setForm({ ...form, items: form.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it) })

  const handleSubmit = (e) => {
    e.preventDefault()
    const total = calcTotal(form.items)
    const data = { ...form, subtotal: total, total }
    if (editing) updateBill(editing, data)
    else addBill(data)
    setModal(null)
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Bills"
        subtitle="Manage vendor bills & payables"
        actions={<button className="btn-primary" onClick={openAdd}><Plus size={16} /> New Bill</button>}
      />

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="form-input pl-9 w-56" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['All', 'open', 'paid', 'overdue'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'} capitalize`}>{s}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-5 py-3 font-medium">Number</th>
              <th className="px-5 py-3 font-medium">Vendor</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-blue-600">{b.number}</td>
                <td className="px-5 py-3 text-gray-700">{vendorName(b.vendorId)}</td>
                <td className="px-5 py-3 text-gray-500">{fmtDate(b.date)}</td>
                <td className="px-5 py-3 text-gray-500">{fmtDate(b.dueDate)}</td>
                <td className="px-5 py-3 text-right font-medium">{fmt(b.total)}</td>
                <td className="px-5 py-3"><span className={statusBadge(b.status)}>{b.status}</span></td>
                <td className="px-5 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setView(b)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Eye size={14} /></button>
                    {b.status === 'open' && (
                      <button onClick={() => updateBill(b.id, { status: 'paid' })} className="p-1.5 rounded hover:bg-blue-50 text-blue-400 hover:text-blue-700 text-xs font-medium px-2">Mark Paid</button>
                    )}
                    <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                    <button onClick={() => deleteBill(b.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No bills found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Edit Bill' : 'New Bill'} onClose={() => setModal(null)} size="xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Vendor *</label>
                <select className="form-select" required value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })}>
                  <option value="">Select vendor</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Bill Date *</label>
                <input type="date" className="form-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0">Line Items</label>
                <button type="button" className="btn-secondary text-xs py-1" onClick={() => setForm({ ...form, items: [...form.items, { description: '', qty: 1, price: 0 }] })}><Plus size={12} /> Add Item</button>
              </div>
              <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Description</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-20">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">Price</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-28">Amount</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((it, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1"><input className="form-input border-0 shadow-none" value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} /></td>
                      <td className="px-2 py-1"><input type="number" className="form-input border-0 shadow-none text-right" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} min="1" /></td>
                      <td className="px-2 py-1"><input type="number" className="form-input border-0 shadow-none text-right" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} min="0" /></td>
                      <td className="px-3 py-1 text-right text-gray-700">{fmt(it.qty * it.price)}</td>
                      <td className="px-2 py-1"><button type="button" onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right font-bold text-lg">
              Total: {fmt(calcTotal(form.items))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Bill'}</button>
            </div>
          </form>
        </Modal>
      )}

      {view && (
        <Modal title={`Bill ${view.number}`} onClose={() => setView(null)} size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-gray-500">Vendor</p><p className="font-medium">{vendorName(view.vendorId)}</p></div>
              <div><p className="text-gray-500">Status</p><span className={statusBadge(view.status)}>{view.status}</span></div>
              <div><p className="text-gray-500">Date</p><p className="font-medium">{fmtDate(view.date)}</p></div>
              <div><p className="text-gray-500">Due Date</p><p className="font-medium">{fmtDate(view.dueDate)}</p></div>
            </div>
            <table className="w-full border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr><th className="px-4 py-2 text-left">Description</th><th className="px-4 py-2 text-right">Qty</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2 text-right">Amount</th></tr>
              </thead>
              <tbody>
                {view.items?.map((it, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-4 py-2">{it.description}</td>
                    <td className="px-4 py-2 text-right">{it.qty}</td>
                    <td className="px-4 py-2 text-right">{fmt(it.price)}</td>
                    <td className="px-4 py-2 text-right">{fmt(it.qty * it.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right font-bold text-lg">Total: {fmt(view.total)}</div>
          </div>
        </Modal>
      )}
    </div>
  )
}
