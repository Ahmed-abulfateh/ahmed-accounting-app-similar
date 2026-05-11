import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard     from './pages/Dashboard'
import AccountsList  from './pages/Accounts/AccountsList'
import JournalEntries from './pages/Journal/JournalEntries'
import CustomersList from './pages/Customers/CustomersList'
import InvoicesList  from './pages/Invoices/InvoicesList'
import VendorsList   from './pages/Vendors/VendorsList'
import BillsList     from './pages/Bills/BillsList'
import ExpensesList  from './pages/Expenses/ExpensesList'
import BalanceSheet  from './pages/Reports/BalanceSheet'
import ProfitLoss    from './pages/Reports/ProfitLoss'
import TrialBalance  from './pages/Reports/TrialBalance'
import Settings      from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts"  element={<AccountsList />} />
          <Route path="journal"   element={<JournalEntries />} />
          <Route path="customers" element={<CustomersList />} />
          <Route path="invoices"  element={<InvoicesList />} />
          <Route path="vendors"   element={<VendorsList />} />
          <Route path="bills"     element={<BillsList />} />
          <Route path="expenses"  element={<ExpensesList />} />
          <Route path="reports">
            <Route path="balance-sheet" element={<BalanceSheet />} />
            <Route path="profit-loss"   element={<ProfitLoss />} />
            <Route path="trial-balance" element={<TrialBalance />} />
          </Route>
          <Route path="settings"  element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
