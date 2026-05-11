import * as XLSX from 'xlsx'
import useStore from '../../store/useStore'
import { fmt } from '../../utils/format'
import PageHeader from '../../components/ui/PageHeader'
import { Download } from 'lucide-react'

const Section = ({ title, rows, total, currency }) => (
  <div className="mb-4">
    <div className="px-5 py-2 bg-gray-100 font-semibold text-gray-700 text-sm">{title}</div>
    {rows.map((r) => (
      <div key={r.id} className="flex justify-between px-5 py-2 text-sm border-b border-gray-50 hover:bg-gray-50">
        <span className="text-gray-700">{r.code} – {r.name}</span>
        <span className="font-medium">{fmt(r.balance, currency)}</span>
      </div>
    ))}
    <div className="flex justify-between px-5 py-2.5 bg-gray-50 font-bold text-sm border-t border-gray-200">
      <span>Total {title}</span>
      <span>{fmt(total, currency)}</span>
    </div>
  </div>
)

export default function BalanceSheet() {
  const accounts = useStore((s) => s.accounts)
  const company  = useStore((s) => s.company)
  const currency = company.currency || 'USD'

  const assets      = accounts.filter((a) => a.type === 'Asset')
  const liabilities = accounts.filter((a) => a.type === 'Liability')
  const equity      = accounts.filter((a) => a.type === 'Equity')

  const totalAssets      = assets.reduce((a, b) => a + b.balance, 0)
  const totalLiabilities = liabilities.reduce((a, b) => a + b.balance, 0)
  const totalEquity      = equity.reduce((a, b) => a + b.balance, 0)
  const totalLiabEquity  = totalLiabilities + totalEquity

  const exportExcel = () => {
    const rows = [
      ['Balance Sheet', company.name],
      ['As of', new Date().toLocaleDateString()],
      ['Currency', currency],
      [],
      ['Section', 'Code', 'Account', 'Balance'],
      ...assets.map((a) => ['Asset', a.code, a.name, a.balance]),
      ['', '', 'Total Assets', totalAssets],
      [],
      ...liabilities.map((a) => ['Liability', a.code, a.name, a.balance]),
      ['', '', 'Total Liabilities', totalLiabilities],
      [],
      ...equity.map((a) => ['Equity', a.code, a.name, a.balance]),
      ['', '', 'Total Equity', totalEquity],
      [],
      ['', '', 'TOTAL LIABILITIES & EQUITY', totalLiabEquity],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Sheet')
    XLSX.writeFile(wb, `balance-sheet-${company.name}.xlsx`)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-0">
        <PageHeader title="Balance Sheet" subtitle={`As of today · ${company.name}`} />
        <button onClick={exportExcel} className="btn btn-secondary flex items-center gap-2 mt-1">
          <Download size={16} /> Export Excel
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5 text-center">
          <p className="text-sm text-gray-500">Total Assets</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(totalAssets, currency)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-sm text-gray-500">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{fmt(totalLiabilities, currency)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-sm text-gray-500">Total Equity</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalEquity, currency)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 font-bold text-gray-800">Assets</div>
          <Section currency={currency} title="Current Assets" rows={assets.filter(a => ['Cash','Accounts Receivable','Inventory'].includes(a.name))} total={assets.filter(a => ['Cash','Accounts Receivable','Inventory'].includes(a.name)).reduce((a,b)=>a+b.balance,0)} />
          <Section currency={currency} title="Fixed Assets"   rows={assets.filter(a => !['Cash','Accounts Receivable','Inventory'].includes(a.name))} total={assets.filter(a => !['Cash','Accounts Receivable','Inventory'].includes(a.name)).reduce((a,b)=>a+b.balance,0)} />
          <div className="flex justify-between px-5 py-3 border-t-2 border-gray-300 font-bold bg-blue-50 text-blue-800">
            <span>TOTAL ASSETS</span><span>{fmt(totalAssets, currency)}</span>
          </div>
        </div>

        {/* Liabilities + Equity */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 font-bold text-gray-800">Liabilities & Equity</div>
          <Section currency={currency} title="Liabilities" rows={liabilities} total={totalLiabilities} />
          <Section currency={currency} title="Equity"      rows={equity}      total={totalEquity} />
          <div className="flex justify-between px-5 py-3 border-t-2 border-gray-300 font-bold bg-blue-50 text-blue-800">
            <span>TOTAL LIABILITIES & EQUITY</span><span>{fmt(totalLiabEquity, currency)}</span>
          </div>
          {Math.abs(totalAssets - totalLiabEquity) > 0.01 && (
            <div className="px-5 py-2 bg-amber-50 text-amber-700 text-xs text-center">
              ⚠ Balance sheet is out of balance by {fmt(Math.abs(totalAssets - totalLiabEquity), currency)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
