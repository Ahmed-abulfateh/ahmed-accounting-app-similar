import { useState } from 'react'
import useStore from '../../store/useStore'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { fmt, fmtDate, statusBadge } from '../../utils/format'
import { Plus, Pencil, Trash2, Search, Eye, Send } from 'lucide-react'

const emptyForm = {
  customerId: '', date: '', dueDate: '', taxRate: 10,
  items: [{ description: '', qty: 1, price: 0 }], notes: '',
}

function calcTotals(items, taxRate) {
  const subtotal = items.reduce((a, it) => a + (Number(it.qty) * Number(it.price)), 0)
  const tax = subtotal * (taxRate / 100)
  return { subtotal, tax, total: subtotal + tax }
}

export default function InvoicesList() {
  const invoices      = useStore((s) => s.invoices)
  const customers     = useStore((s) => s.customers)
  const addInvoice    = useStore((s) => s.addInvoice)
  const updateInvoice = useStore((s) => s.updateInvoice)
  const deleteInvoice = useStore((s) => s.deleteInvoice)

  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [view, setView]       = useState(null)
  const [search, setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const customerName = (id) => customers.find((c) => c.id === id)?.name ?? '—'

  const filtered = invoices
    .filter((i) => statusFilter === 'All' || i.status === statusFilter)
    .filter((i) =>
      i.number.toLowerCase().includes(search.toLowerCase()) ||
      customerName(i.customerId).toLowerCase().includes(search.toLowerCase())
    )

  const openAdd = () => {
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0], dueDate: '' })
    setEditing(null); setModal('form')
  }
  const openEdit = (inv) => {
    setForm({ customerId: inv.customerId, date: inv.date, dueDate: inv.dueDate, taxRate: 10, items: inv.items, notes: inv.notes })
    setEditing(inv.id); setModal('form')
  }

  const setItem = (i, key, val) => {
    const items = form.items.map((it, idx) => idx === i ? { ...it, [key]: val } : it)
    setForm({ ...form, items })
  }
  const addItem    = () => setForm({ ...form, items: [...form.items, { description: '', qty: 1, price: 0 }] })
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })

  const handleSubmit = (e) => {
    e.preventDefault()
    const { subtotal, tax, total } = calcTotals(form.items, form.taxRate)
    const data = { ...form, subtotal, tax, total }
    if (editing) updateInvoice(editing, data)
    else addInvoice(data)
    setModal(null)
  }

  const totals = calcTotals(form.items, form.taxRate)

  return (
    <div className="p-8">
      <PageHeader
        title="Invoices"
        subtitle="Manage customer invoices"
        actions={
          <button className="btn-primary" onClick={openAdd}><Plus size={16} /> New Invoice</button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="form-input pl-9 w-56" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['All','draft','sent','paid','overdue'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-secondary'} capitalize`}>{s}</button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-5 py-3 font-medium">Number</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-blue-600">{inv.number}</td>
                <td className="px-5 py-3 text-gray-700">{customerName(inv.customerId)}</td>
                <td className="px-5 py-3 text-gray-500">{fmtDate(inv.date)}</td>
                <td className="px-5 py-3 text-gray-500">{fmtDate(inv.dueDate)}</td>
                <td className="px-5 py-3 text-right font-medium">{fmt(inv.total)}</td>
                <td className="px-5 py-3"><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                <td className="px-5 py-3">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => setView(inv)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Eye size={14} /></button>
                    {inv.status === 'draft' && (
                      <button onClick={() => updateInvoice(inv.id, { status: 'sent' })} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600"><Send size={14} /></button>
                    )}
                    {inv.status === 'sent' && (
                      <button onClick={() => updateInvoice(inv.id, { status: 'paid' })} className="p-1.5 rounded hover:bg-blue-50 text-blue-400 hover:text-blue-700 text-xs font-medium px-2">Mark Paid</button>
                    )}
                    <button onClick={() => openEdit(inv)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                    <button onClick={() => deleteInvoice(inv.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {modal === 'form' && (
        <Modal title={editing ? 'Edit Invoice' : 'New Invoice'} onClose={() => setModal(null)} size="xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Customer *</label>
                <select className="form-select" required value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                  <option value="">Select customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Invoice Date *</label>
                <input type="date" className="form-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0">Line Items</label>
                <button type="button" className="btn-secondary text-xs py-1" onClick={addItem}><Plus size={12} /> Add Item</button>
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
                      <td className="px-2 py-1"><input className="form-input border-0 shadow-none" value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Description" /></td>
                      <td className="px-2 py-1"><input type="number" className="form-input border-0 shadow-none text-right" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} min="1" /></td>
                      <td className="px-2 py-1"><input type="number" className="form-input border-0 shadow-none text-right" value={it.price} onChange={(e) => setItem(i, 'price', e.target.value)} min="0" /></td>
                      <td className="px-3 py-1 text-right text-gray-700">{fmt(it.qty * it.price)}</td>
                      <td className="px-2 py-1"><button type="button" onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <label className="form-label">Tax Rate (%)</label>
                  <input type="number" className="form-input w-24" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} min="0" max="100" />
                </div>
                <div className="bg-gray-50 rounded-lg p-3 space-y-1 mt-2">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmt(totals.subtotal)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Tax ({form.taxRate}%)</span><span>{fmt(totals.tax)}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200"><span>Total</span><span>{fmt(totals.total)}</span></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Create Invoice'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Invoice Modal */}
      {view && (
        <Modal title={`Invoice ${view.number}`} onClose={() => setView(null)} size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-gray-500">Customer</p><p className="font-medium">{customerName(view.customerId)}</p></div>
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
            <div className="text-right space-y-1">
              <p className="text-gray-500">Subtotal: <span className="font-medium text-gray-900">{fmt(view.subtotal)}</span></p>
              <p className="text-gray-500">Tax: <span className="font-medium text-gray-900">{fmt(view.tax)}</span></p>
              <p className="text-lg font-bold">Total: {fmt(view.total)}</p>
            </div>
            {view.notes && <p className="text-gray-500">Notes: {view.notes}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}
