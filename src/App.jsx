import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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
import Login         from './pages/Auth/Login'
import Signup        from './pages/Auth/Signup'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

function AuthRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<AccountsList />} />
        <Route path="/journal" element={<JournalEntries />} />
        <Route path="/customers" element={<CustomersList />} />
        <Route path="/invoices" element={<InvoicesList />} />
        <Route path="/vendors" element={<VendorsList />} />
        <Route path="/bills" element={<BillsList />} />
        <Route path="/expenses" element={<ExpensesList />} />
        <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
        <Route path="/reports/profit-loss" element={<ProfitLoss />} />
        <Route path="/reports/trial-balance" element={<TrialBalance />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AuthRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
