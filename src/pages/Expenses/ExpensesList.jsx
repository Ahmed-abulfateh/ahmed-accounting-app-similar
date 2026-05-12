import { useState } from 'react'
import useStore from '../../store/useStore'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { fmt, fmtDate } from '../../utils/format'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'

const CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Travel', 'Marketing', 'Software', 'Office Supplies', 'Insurance', 'Maintenance', 'Other']

const emptyForm = { date: '', category: 'Other', accountId: '', amount: '', description: '', payee: '' }

export default function ExpensesList() {
  const expenses      = useStore((s) => s.expenses)
  const accounts      = useStore((s) => s.accounts)
  const addExpense    = useStore((s) => s.addExpense)
  const updateExpense = useStore((s) => s.updateExpense)
  const deleteExpense = useStore((s) => s.deleteExpense)

  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [search, setSearch]   = useState('')
  const [catFilter, setCatFilter] = useState('All')

  const expenseAccounts = accounts.filter((a) => a.type === 'Expense' || a.type === 'Asset')
  const accountName = (id) => accounts.find((a) => a.id === id)?.name ?? '—'

  const filtered = expenses
    .filter((e) => catFilter === 'All' || e.category === catFilter)
    .filter((e) =>
      e.description?.toLowerCase().includes(search.toLowerCase()) ||
      e.payee?.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase())
    )

  const total = filtered.reduce((a, e) => a + e.amount, 0)

  const openAdd = () => { setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] }); setEditing(null); setModal('form') }
  const openEdit = (e) => { setForm({ date: e.date, category: e.category, accountId: e.accountId, amount: e.amount, description: e.description, payee: e.payee }); setEditing(e.id); setModal('form') }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const data = { ...form, amount: Number(form.amount) }
    if (editing) updateExpense(editing, data)
    else addExpense(data)
    setModal(null)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Expenses"
        subtitle="Track and categorize all business expenses"
        actions={<button className="btn-primary" onClick={openAdd}><Plus size={16} /> New Expense</button>}
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        {['All', ...CATEGORIES.slice(0, 5)].map((cat) => {
          const amt = expenses.filter(e => cat === 'All' || e.category === cat).reduce((a, e) => a + e.amount, 0)
          return (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`card p-4 text-left hover:border-blue-200 transition-colors ${catFilter === cat ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}>
              <p className="text-xs text-gray-500">{cat}</p>
              <p className="font-bold text-gray-900 mt-1">{fmt(amt)}</p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input className="form-input pl-9 w-full sm:w-56" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select w-full sm:w-44" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 sm:px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between text-sm">
          <span className="font-medium text-gray-700">{filtered.length} expenses</span>
          <span className="font-bold text-gray-900">Total: {fmt(total)}</span>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Payee</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Account</th>
              <th className="px-5 py-3 font-medium">Description</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
              <th className="px-5 py-3 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 text-gray-500">{fmtDate(e.date)}</td>
                <td className="px-5 py-3 text-gray-700 font-medium">{e.payee}</td>
                <td className="px-5 py-3"><span className="badge badge-yellow">{e.category}</span></td>
                <td className="px-5 py-3 text-gray-500">{accountName(e.accountId)}</td>
                <td className="px-5 py-3 text-gray-500">{e.description}</td>
                <td className="px-5 py-3 text-right font-medium text-red-600">{fmt(e.amount)}</td>
                <td className="px-5 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(e)} className="btn-small bg-white border border-gray-200 text-gray-400 hover:text-blue-600" aria-label={`Edit ${e.payee || 'expense'}`}><Pencil size={14} /></button>
                    <button onClick={() => deleteExpense(e.id)} className="btn-small bg-white border border-gray-200 text-gray-400 hover:text-red-600" aria-label={`Delete ${e.payee || 'expense'}`}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">No expenses found</td></tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Edit Expense' : 'New Expense'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Category *</label>
                <select className="form-select" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Payee *</label>
                <input className="form-input" required value={form.payee} onChange={(e) => setForm({ ...form, payee: e.target.value })} placeholder="Who was paid" />
              </div>
              <div>
                <label className="form-label">Amount *</label>
                <input type="number" className="form-input" required min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">Account</label>
              <select className="form-select" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                <option value="">Select account</option>
                {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? 'Save Changes' : 'Record Expense'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
