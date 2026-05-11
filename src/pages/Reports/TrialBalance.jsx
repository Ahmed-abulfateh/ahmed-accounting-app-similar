import * as XLSX from 'xlsx'
import useStore from '../../store/useStore'
import { fmt } from '../../utils/format'
import PageHeader from '../../components/ui/PageHeader'
import { Download } from 'lucide-react'

export default function TrialBalance() {
  const accounts = useStore((s) => s.accounts)
  const company  = useStore((s) => s.company)
  const currency = company.currency || 'USD'

  const rows = accounts.map((a) => {
    const isDebitNormal = a.normal === 'debit'
    return {
      ...a,
      debit:  isDebitNormal ? a.balance : 0,
      credit: isDebitNormal ? 0 : a.balance,
    }
  })

  const totalDebits  = rows.reduce((a, r) => a + r.debit, 0)
  const totalCredits = rows.reduce((a, r) => a + r.credit, 0)
  const isBalanced   = Math.abs(totalDebits - totalCredits) < 0.01

  const typeOrder = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']
  const sorted = [...rows].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || a.code.localeCompare(b.code))

  const typeColors = {
    Asset: 'text-blue-600', Liability: 'text-red-500', Equity: 'text-green-600',
    Revenue: 'text-emerald-600', Expense: 'text-orange-500',
  }

  const exportExcel = () => {
    const header = ['Code', 'Account Name', 'Type', 'Debit', 'Credit']
    const dataRows = sorted.map((r) => [r.code, r.name, r.type, r.debit || '', r.credit || ''])
    const totals   = ['', 'Totals', '', totalDebits, totalCredits]
    const ws = XLSX.utils.aoa_to_sheet([
      ['Trial Balance', company.name],
      ['Currency', currency],
      [],
      header,
      ...dataRows,
      [],
      totals,
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Trial Balance')
    XLSX.writeFile(wb, `trial-balance-${company.name}.xlsx`)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-0">
        <PageHeader title="Trial Balance" subtitle={`Unadjusted · ${company.name}`} />
        <button onClick={exportExcel} className="btn btn-secondary flex items-center gap-2 mt-1">
          <Download size={16} /> Export Excel
        </button>
      </div>

      {!isBalanced && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          ⚠ Trial balance is out of balance by {fmt(Math.abs(totalDebits - totalCredits), currency)}
        </div>
      )}
      {isBalanced && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          ✓ Trial balance is balanced
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-600">
              <th className="px-5 py-3 font-semibold">Code</th>
              <th className="px-5 py-3 font-semibold">Account Name</th>
              <th className="px-5 py-3 font-semibold">Type</th>
              <th className="px-5 py-3 font-semibold text-right">Debit</th>
              <th className="px-5 py-3 font-semibold text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sorted.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 font-mono text-gray-500">{r.code}</td>
                <td className="px-5 py-2.5 text-gray-900">{r.name}</td>
                <td className="px-5 py-2.5">
                  <span className={`text-xs font-medium ${typeColors[r.type]}`}>{r.type}</span>
                </td>
                <td className="px-5 py-2.5 text-right font-medium">{r.debit  > 0 ? fmt(r.debit, currency)  : ''}</td>
                <td className="px-5 py-2.5 text-right font-medium">{r.credit > 0 ? fmt(r.credit, currency) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 bg-gray-100 font-bold">
              <td className="px-5 py-3" colSpan={3}>Totals</td>
              <td className="px-5 py-3 text-right text-blue-700">{fmt(totalDebits, currency)}</td>
              <td className="px-5 py-3 text-right text-blue-700">{fmt(totalCredits, currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
