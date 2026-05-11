import { useMemo, useState } from 'react'
import useStore from '../store/useStore'
import { fmt, fmtDate, statusBadge } from '../utils/format'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, FileText, Landmark } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

export default function Dashboard() {
  const invoices = useStore((s) => s.invoices)
  const bills    = useStore((s) => s.bills)
  const expenses = useStore((s) => s.expenses)
  const customers = useStore((s) => s.customers)
  const company = useStore((s) => s.company)

  const [rangePreset, setRangePreset] = useState('90d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const { startDate, endDate } = useMemo(
    () => getDateRange(rangePreset, customStart, customEnd),
    [rangePreset, customStart, customEnd]
  )

  const filteredInvoices = useMemo(
    () => invoices.filter((i) => isInRange(i.date, startDate, endDate)),
    [invoices, startDate, endDate]
  )
  const filteredBills = useMemo(
    () => bills.filter((b) => isInRange(b.date, startDate, endDate)),
    [bills, startDate, endDate]
  )
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => isInRange(e.date, startDate, endDate)),
    [expenses, startDate, endDate]
  )

  const totalRevenue = filteredInvoices.filter(i => i.status === 'paid').reduce((a, b) => a + b.total, 0)
  const totalExpenses = filteredExpenses.reduce((a, b) => a + b.amount, 0) + filteredBills.filter(b => b.status === 'paid').reduce((a, b) => a + b.total, 0)
  const totalReceivable = filteredInvoices.filter(i => i.status !== 'paid').reduce((a, b) => a + b.total, 0)
  const totalPayable = filteredBills.filter(b => b.status !== 'paid').reduce((a, b) => a + b.total, 0)
  const netPosition = totalRevenue - totalExpenses

  const expenseByCategory = filteredExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))
  const customerById = Object.fromEntries(customers.map((c) => [c.id, c.name]))

  const monthlyData = buildMonthlySeries(filteredInvoices, filteredBills, filteredExpenses, startDate, endDate)

  const recentInvoices = [...filteredInvoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Financial overview of your business</p>
      </div>

      <div className="card p-4 mb-6 flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: '30d', label: 'Last 30 days' },
            { key: '90d', label: 'Last 90 days' },
            { key: 'ytd', label: 'Year to date' },
            { key: 'all', label: 'All time' },
            { key: 'custom', label: 'Custom' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRangePreset(opt.key)}
              className={`btn ${rangePreset === opt.key ? 'btn-primary' : 'btn-secondary'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {rangePreset === 'custom' && (
          <div className="flex flex-col sm:flex-row gap-3 lg:ml-auto">
            <div>
              <label className="form-label">From</label>
              <input
                type="date"
                className="form-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">To</label>
              <input
                type="date"
                className="form-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={fmt(totalRevenue, company.currency)} sub="Paid invoices" icon={ArrowUpRight} color="bg-cyan-600" />
        <StatCard label="Total Expenses" value={fmt(totalExpenses, company.currency)} sub="Paid bills + expenses" icon={ArrowDownRight} color="bg-rose-500" />
        <StatCard label="Receivable" value={fmt(totalReceivable, company.currency)} sub="Unpaid invoices" icon={FileText} color="bg-amber-500" />
        <StatCard label="Net Position" value={fmt(netPosition, company.currency)} sub={`${fmt(totalPayable, company.currency)} payables`} icon={Landmark} color={netPosition >= 0 ? 'bg-emerald-600' : 'bg-orange-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Monthly Performance Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Monthly Performance</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(v, company.currency)} />
              <Area type="monotone" dataKey="revenue"  stroke="#3b82f6" fill="url(#colorRev)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="outflow" stroke="#ef4444" fill="url(#colorExp)" strokeWidth={2} name="Outflow" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Expense Breakdown</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v, company.currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">No expenses recorded yet.</div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Recent Invoices</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-gray-500">
              <th className="px-5 py-3 font-medium">Number</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentInvoices.map((inv) => {
              const customer = customerById[inv.customerId] ?? '—'
              return (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-blue-600">{inv.number}</td>
                  <td className="px-5 py-3 text-gray-700">{customer}</td>
                  <td className="px-5 py-3 text-gray-500">{fmtDate(inv.date)}</td>
                  <td className="px-5 py-3 font-medium">{fmt(inv.total, company.currency)}</td>
                  <td className="px-5 py-3"><span className={statusBadge(inv.status)}>{inv.status}</span></td>
                </tr>
              )
            })}
            {recentInvoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-500">
                  No invoices in the selected period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function buildMonthlySeries(invoices, bills, expenses, startDate, endDate) {
  const months = []
  const start = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1)
  const end = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const cursor = new Date(start)
  while (cursor <= end) {
    months.push({
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      month: cursor.toLocaleString('en-US', { month: 'short' }),
      revenue: 0,
      outflow: 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return months
}

function getDateRange(preset, customStart, customEnd) {
  const now = new Date()
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  if (preset === 'all') {
    return { startDate: null, endDate: null }
  }

  if (preset === 'ytd') {
    return { startDate: new Date(now.getFullYear(), 0, 1), endDate: endOfDay }
  }

  if (preset === '30d' || preset === '90d') {
    const days = preset === '30d' ? 29 : 89
    const start = new Date(now)
    start.setDate(now.getDate() - days)
    start.setHours(0, 0, 0, 0)
    return { startDate: start, endDate: endOfDay }
  }

  const start = customStart ? new Date(`${customStart}T00:00:00`) : null
  const end = customEnd ? new Date(`${customEnd}T23:59:59`) : null
  return { startDate: start, endDate: end }
}

function isInRange(value, startDate, endDate) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  if (startDate && date < startDate) return false
  if (endDate && date > endDate) return false
  return true
}
