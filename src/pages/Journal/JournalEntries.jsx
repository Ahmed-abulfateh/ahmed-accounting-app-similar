import { useState } from 'react'
import useStore from '../../store/useStore'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { fmt, fmtDate } from '../../utils/format'
import { Plus, Trash2 } from 'lucide-react'

const emptyForm = {
  date: '',
  description: '',
  lines: [
    { accountId: '', debit: '', credit: '' },
    { accountId: '', debit: '', credit: '' },
  ],
}

export default function JournalEntries() {
  const entries      = useStore((s) => s.journalEntries)
  const accounts     = useStore((s) => s.accounts)
  const addEntry     = useStore((s) => s.addJournalEntry)
  const deleteEntry  = useStore((s) => s.deleteJournalEntry)

  const [modal, setModal] = useState(false)
  const [form, setForm]   = useState(emptyForm)

  const accountName = (id) => accounts.find((a) => a.id === id)?.name ?? '—'

  const setLine = (i, key, val) =>
    setForm({ ...form, lines: form.lines.map((l, idx) => idx === i ? { ...l, [key]: val } : l) })

  const totalDebits  = form.lines.reduce((a, l) => a + Number(l.debit  || 0), 0)
  const totalCredits = form.lines.reduce((a, l) => a + Number(l.credit || 0), 0)
  const balanced     = Math.abs(totalDebits - totalCredits) < 0.01

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!balanced) return
    addEntry({
      date: form.date,
      description: form.description,
      lines: form.lines.map((l) => ({ accountId: l.accountId, debit: Number(l.debit || 0), credit: Number(l.credit || 0) })),
    })
    setModal(false)
    setForm({ ...emptyForm, date: '' })
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Journal Entries"
        subtitle="Double-entry bookkeeping records"
        actions={<button className="btn-primary" onClick={() => { setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] }); setModal(true) }}><Plus size={16} /> New Entry</button>}
      />

      <div className="space-y-4">
        {entries.map((je) => {
          const debitsTotal  = je.lines.reduce((a, l) => a + l.debit, 0)
          const creditsTotal = je.lines.reduce((a, l) => a + l.credit, 0)
          return (
            <div key={je.id} className="card overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-blue-600">{je.reference}</span>
                  <span className="text-gray-500 text-sm">{fmtDate(je.date)}</span>
                  <span className="text-gray-700 text-sm">{je.description}</span>
                </div>
                <button onClick={() => deleteEntry(je.id)} className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-5 py-2 font-medium">Account</th>
                    <th className="px-5 py-2 font-medium text-right">Debit</th>
                    <th className="px-5 py-2 font-medium text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {je.lines.map((l, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className={`px-5 py-2 ${l.debit > 0 ? '' : 'pl-12'}`}>{accountName(l.accountId)}</td>
                      <td className="px-5 py-2 text-right">{l.debit  > 0 ? fmt(l.debit)  : ''}</td>
                      <td className="px-5 py-2 text-right">{l.credit > 0 ? fmt(l.credit) : ''}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                    <td className="px-5 py-2 text-gray-600">Total</td>
                    <td className="px-5 py-2 text-right">{fmt(debitsTotal)}</td>
                    <td className="px-5 py-2 text-right">{fmt(creditsTotal)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title="New Journal Entry" onClose={() => setModal(false)} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Description *</label>
                <input className="form-input" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0">Journal Lines</label>
                <button type="button" className="btn-secondary text-xs py-1"
                  onClick={() => setForm({ ...form, lines: [...form.lines, { accountId: '', debit: '', credit: '' }] })}>
                  <Plus size={12} /> Add Line
                </button>
              </div>
              <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Account</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Debit</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-32">Credit</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((l, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-2 py-1">
                        <select className="form-select border-0 shadow-none" value={l.accountId} onChange={(e) => setLine(i, 'accountId', e.target.value)}>
                          <option value="">Select account</option>
                          {accounts.map((a) => <option key={a.id} value={a.id}>{a.code} – {a.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" className="form-input border-0 shadow-none text-right" placeholder="0.00" value={l.debit} onChange={(e) => setLine(i, 'debit', e.target.value)} min="0" step="0.01" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" className="form-input border-0 shadow-none text-right" placeholder="0.00" value={l.credit} onChange={(e) => setLine(i, 'credit', e.target.value)} min="0" step="0.01" />
                      </td>
                      <td className="px-2 py-1">
                        {form.lines.length > 2 && (
                          <button type="button" onClick={() => setForm({ ...form, lines: form.lines.filter((_, idx) => idx !== i) })} className="text-gray-300 hover:text-red-500"><Trash2 size={14} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-gray-200 bg-gray-50 font-semibold text-sm">
                    <td className="px-3 py-2 text-gray-600">Totals</td>
                    <td className="px-3 py-2 text-right">{fmt(totalDebits)}</td>
                    <td className="px-3 py-2 text-right">{fmt(totalCredits)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
              {!balanced && totalDebits > 0 && (
                <p className="text-red-500 text-xs mt-1">⚠ Entry is not balanced. Debits must equal credits.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={!balanced || totalDebits === 0}>Post Entry</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
