import useStore from '../store/useStore'
import { fmt, fmtDate, statusBadge } from '../utils/format'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, FileText, ShoppingCart, Landmark } from 'lucide-react'

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

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((a, b) => a + b.total, 0)
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0) + bills.filter(b => b.status === 'paid').reduce((a, b) => a + b.total, 0)
  const totalReceivable = invoices.filter(i => i.status !== 'paid').reduce((a, b) => a + b.total, 0)
  const totalPayable = bills.filter(b => b.status !== 'paid').reduce((a, b) => a + b.total, 0)
  const netPosition = totalRevenue - totalExpenses

  const expenseByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})
  const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }))
  const customerById = Object.fromEntries(customers.map((c) => [c.id, c.name]))

  const monthlyData = buildMonthlySeries(invoices, bills, expenses)

  const recentInvoices = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Financial overview of your business</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Revenue" value={fmt(totalRevenue, company.currency)} sub="Paid invoices" icon={ArrowUpRight} color="bg-cyan-600" />
        <StatCard label="Total Expenses" value={fmt(totalExpenses, company.currency)} sub="Paid bills + expenses" icon={ArrowDownRight} color="bg-rose-500" />
        <StatCard label="Receivable" value={fmt(totalReceivable, company.currency)} sub="Unpaid invoices" icon={FileText} color="bg-amber-500" />
        <StatCard label="Net Position" value={fmt(netPosition, company.currency)} sub={netPosition >= 0 ? 'Positive cash posture' : 'Needs attention'} icon={Landmark} color={netPosition >= 0 ? 'bg-emerald-600' : 'bg-orange-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue vs Expenses Chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Revenue vs Expenses</h2>
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
          </tbody>
        </table>
      </div>
    </div>
  )
}

function buildMonthlySeries(invoices, bills, expenses) {
  const now = new Date()
  const months = []

  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: d.toLocaleString('en-US', { month: 'short' }),
      revenue: 0,
      outflow: 0,
    })
  }

  const byKey = Object.fromEntries(months.map((m) => [m.key, m]))

  invoices.forEach((inv) => {
    const d = new Date(inv.date)
    if (Number.isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (byKey[key]) byKey[key].revenue += Number(inv.total || 0)
  })

  bills.forEach((bill) => {
    const d = new Date(bill.date)
    if (Number.isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (byKey[key]) byKey[key].outflow += Number(bill.total || 0)
  })

  expenses.forEach((exp) => {
    const d = new Date(exp.date)
    if (Number.isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (byKey[key]) byKey[key].outflow += Number(exp.amount || 0)
  })

  return months
}
