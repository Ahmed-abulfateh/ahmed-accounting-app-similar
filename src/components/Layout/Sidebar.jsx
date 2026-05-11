import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Users, Package, FileText,
  ShoppingCart, DollarSign, BarChart2, Settings,
  TrendingUp, ChevronDown, ChevronRight, X
} from 'lucide-react'
import { useState } from 'react'
import useStore from '../../store/useStore'
import clsx from 'clsx'

const NavItem = ({ to, icon: Icon, label, end, onNavigate }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onNavigate}
    className={({ isActive }) =>
      clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
        isActive
          ? 'bg-teal-700 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
    }
  >
    <Icon size={18} />
    {label}
  </NavLink>
)

const NavGroup = ({ icon: Icon, label, children }) => {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
      >
        {label}
        {open ? <ChevronDown size={12} className="ml-auto" /> : <ChevronRight size={12} className="ml-auto" />}
      </button>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  const company = useStore((s) => s.company)
  const handleNavigate = () => {
    if (mobileOpen) onClose()
  }

  return (
    <>
      {mobileOpen && <button type="button" onClick={onClose} className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" aria-label="Close sidebar" />}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 left-0 z-40 w-72 lg:w-64 shrink-0 border-r border-slate-200 bg-white/95 backdrop-blur flex flex-col h-screen transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-700 flex items-center justify-center">
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-sm text-slate-900">{company.name}</p>
            <p className="text-xs text-slate-500">{company.currency}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden ml-auto p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        <NavItem to="/" end icon={LayoutDashboard} label="Dashboard" onNavigate={handleNavigate} />

        <NavGroup label="Accounting">
          <NavItem to="/accounts" icon={BookOpen} label="Chart of Accounts" onNavigate={handleNavigate} />
          <NavItem to="/journal" icon={FileText} label="Journal Entries" onNavigate={handleNavigate} />
        </NavGroup>

        <NavGroup label="Sales">
          <NavItem to="/customers" icon={Users} label="Customers" onNavigate={handleNavigate} />
          <NavItem to="/invoices" icon={FileText} label="Invoices" onNavigate={handleNavigate} />
        </NavGroup>

        <NavGroup label="Purchases">
          <NavItem to="/vendors" icon={Package} label="Vendors" onNavigate={handleNavigate} />
          <NavItem to="/bills" icon={ShoppingCart} label="Bills" onNavigate={handleNavigate} />
        </NavGroup>

        <NavGroup label="Other">
          <NavItem to="/expenses" icon={DollarSign} label="Expenses" onNavigate={handleNavigate} />
        </NavGroup>

        <NavGroup label="Reports">
          <NavItem to="/reports/balance-sheet" icon={BarChart2} label="Balance Sheet" onNavigate={handleNavigate} />
          <NavItem to="/reports/profit-loss" icon={TrendingUp} label="Profit & Loss" onNavigate={handleNavigate} />
          <NavItem to="/reports/trial-balance" icon={BookOpen} label="Trial Balance" onNavigate={handleNavigate} />
        </NavGroup>
      </nav>

      <div className="p-3 border-t border-slate-200 space-y-0.5">
        <NavItem to="/settings" icon={Settings} label="Settings" onNavigate={handleNavigate} />
      </div>
      </aside>
    </>
  )
}
