import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { CalendarDays, Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  const sectionTitle = useMemo(() => {
    if (pathname === '/') return 'Dashboard'
    if (pathname.startsWith('/accounts')) return 'Chart of Accounts'
    if (pathname.startsWith('/journal')) return 'Journal Entries'
    if (pathname.startsWith('/customers')) return 'Customers'
    if (pathname.startsWith('/invoices')) return 'Invoices'
    if (pathname.startsWith('/vendors')) return 'Vendors'
    if (pathname.startsWith('/bills')) return 'Bills'
    if (pathname.startsWith('/expenses')) return 'Expenses'
    if (pathname.startsWith('/reports')) return 'Reports'
    if (pathname.startsWith('/settings')) return 'Settings'
    return 'Accounting Workspace'
  }, [pathname])

  const today = useMemo(
    () => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()),
    []
  )

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="lg:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900">{sectionTitle}</h1>
                <p className="text-xs text-slate-500">Financial workspace</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600">
              <CalendarDays size={14} className="text-teal-700" />
              <span>{today}</span>
            </div>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
