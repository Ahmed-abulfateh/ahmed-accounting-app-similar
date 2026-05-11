import * as XLSX from 'xlsx'
import useStore from '../../store/useStore'
import { fmt } from '../../utils/format'
import PageHeader from '../../components/ui/PageHeader'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Download } from 'lucide-react'

const monthlyData = [
  { month: 'Jan', revenue: 12000, expenses: 7000 },
  { month: 'Feb', revenue: 18000, expenses: 9000 },
  { month: 'Mar', revenue: 15000, expenses: 8500 },
  { month: 'Apr', revenue: 22000, expenses: 11000 },
  { month: 'May', revenue: 19000, expenses: 10000 },
  { month: 'Jun', revenue: 28000, expenses: 13000 },
  { month: 'Jul', revenue: 24000, expenses: 12000 },
].map((d) => ({ ...d, profit: d.revenue - d.expenses }))

export default function ProfitLoss() {
  const accounts = useStore((s) => s.accounts)
  const expenses = useStore((s) => s.expenses)
  const invoices = useStore((s) => s.invoices)
  const company  = useStore((s) => s.company)
  const currency = company.currency || 'USD'

  const revenues  = accounts.filter((a) => a.type === 'Revenue')
  const expAccts  = accounts.filter((a) => a.type === 'Expense')

  const totalRevenue  = revenues.reduce((a, b) => a + b.balance, 0)
  const totalExpenses = expAccts.reduce((a, b) => a + b.balance, 0)
  const grossProfit   = totalRevenue - totalExpenses
  const cogs          = accounts.find((a) => a.name === 'Cost of Goods Sold')?.balance ?? 0
  const netProfit     = grossProfit

  const exportExcel = () => {
    const rows = [
      ['Profit & Loss', company.name],
      ['Period', 'Year to Date'],
      ['Currency', currency],
      [],
      ['Revenue'],
      ['Account', 'Amount'],
      ...revenues.map((r) => [r.name, r.balance]),
      ['Total Revenue', totalRevenue],
      [],
      ['Expenses'],
      ['Account', 'Amount'],
      ...expAccts.map((e) => [e.name, e.balance]),
      ['Total Expenses', totalExpenses],
      [],
      [netProfit >= 0 ? 'NET PROFIT' : 'NET LOSS', Math.abs(netProfit)],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Profit & Loss')
    XLSX.writeFile(wb, `profit-loss-${company.name}.xlsx`)
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-0">
        <PageHeader title="Profit & Loss" subtitle={`YTD Summary · ${company.name}`} />
        <button onClick={exportExcel} className="btn btn-secondary flex items-center gap-2 mt-1">
          <Download size={16} /> Export Excel
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{fmt(totalRevenue, currency)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">COGS</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{fmt(cogs, currency)}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Expenses</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{fmt(totalExpenses, currency)}</p>
        </div>
        <div className={`card p-5 text-center ${netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Net Profit</p>
          <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(netProfit, currency)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Monthly Performance</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v, currency)} />
            <Legend />
            <Bar dataKey="revenue"  fill="#10b981" name="Revenue"  radius={[4,4,0,0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4,4,0,0]} />
            <Bar dataKey="profit"   fill="#3b82f6" name="Profit"   radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-green-50 border-b border-green-100 font-bold text-green-800">Revenue</div>
          {revenues.map((r) => (
            <div key={r.id} className="flex justify-between px-5 py-2.5 text-sm border-b border-gray-50 hover:bg-gray-50">
              <span className="text-gray-700">{r.name}</span>
              <span className="font-medium text-green-700">{fmt(r.balance, currency)}</span>
            </div>
          ))}
          <div className="flex justify-between px-5 py-3 bg-green-50 font-bold text-sm">
            <span>Total Revenue</span><span className="text-green-700">{fmt(totalRevenue, currency)}</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 font-bold text-red-800">Expenses</div>
          {expAccts.map((e) => (
            <div key={e.id} className="flex justify-between px-5 py-2.5 text-sm border-b border-gray-50 hover:bg-gray-50">
              <span className="text-gray-700">{e.name}</span>
              <span className="font-medium text-red-600">{fmt(e.balance, currency)}</span>
            </div>
          ))}
          <div className="flex justify-between px-5 py-3 bg-red-50 font-bold text-sm">
            <span>Total Expenses</span><span className="text-red-700">{fmt(totalExpenses, currency)}</span>
          </div>
        </div>
      </div>

      <div className={`card mt-4 p-5 flex justify-between items-center font-bold text-lg ${netProfit >= 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
        <span>NET {netProfit >= 0 ? 'PROFIT' : 'LOSS'}</span>
        <span>{fmt(Math.abs(netProfit), currency)}</span>
      </div>
    </div>
  )
}
