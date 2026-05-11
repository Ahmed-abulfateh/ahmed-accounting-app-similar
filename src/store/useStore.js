import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

// ── seed data ──────────────────────────────────────────────────────────────
const SEED_ACCOUNTS = [
  { id: '1', code: '1000', name: 'Cash',                   type: 'Asset',     normal: 'debit',  balance: 25000, description: 'Cash on hand' },
  { id: '2', code: '1100', name: 'Accounts Receivable',    type: 'Asset',     normal: 'debit',  balance: 15000, description: 'Money owed by customers' },
  { id: '3', code: '1200', name: 'Inventory',              type: 'Asset',     normal: 'debit',  balance: 30000, description: 'Goods held for sale' },
  { id: '4', code: '1500', name: 'Equipment',              type: 'Asset',     normal: 'debit',  balance: 50000, description: 'Office equipment' },
  { id: '5', code: '2000', name: 'Accounts Payable',       type: 'Liability', normal: 'credit', balance: 8000,  description: 'Money owed to vendors' },
  { id: '6', code: '2100', name: 'Loans Payable',          type: 'Liability', normal: 'credit', balance: 20000, description: 'Long-term loans' },
  { id: '7', code: '3000', name: 'Owner\'s Equity',        type: 'Equity',    normal: 'credit', balance: 92000, description: 'Owner equity' },
  { id: '8', code: '4000', name: 'Sales Revenue',          type: 'Revenue',   normal: 'credit', balance: 60000, description: 'Product sales' },
  { id: '9', code: '5000', name: 'Cost of Goods Sold',     type: 'Expense',   normal: 'debit',  balance: 24000, description: 'COGS' },
  { id: '10',code: '5100', name: 'Rent Expense',           type: 'Expense',   normal: 'debit',  balance: 6000,  description: 'Monthly rent' },
  { id: '11',code: '5200', name: 'Salaries Expense',       type: 'Expense',   normal: 'debit',  balance: 18000, description: 'Employee salaries' },
  { id: '12',code: '5300', name: 'Utilities Expense',      type: 'Expense',   normal: 'debit',  balance: 2000,  description: 'Electricity, water, etc.' },
]

const SEED_CUSTOMERS = [
  { id: 'c1', name: 'Acme Corp',       email: 'billing@acme.com',     phone: '+1-555-0101', address: '123 Main St, NY', balance: 4500, createdAt: '2024-01-10' },
  { id: 'c2', name: 'Globex Ltd',      email: 'accounts@globex.com',  phone: '+1-555-0102', address: '456 Oak Ave, CA', balance: 7200, createdAt: '2024-02-15' },
  { id: 'c3', name: 'Initech LLC',     email: 'ap@initech.com',       phone: '+1-555-0103', address: '789 Pine Rd, TX', balance: 0,    createdAt: '2024-03-01' },
]

const SEED_VENDORS = [
  { id: 'v1', name: 'SupplyCo',        email: 'orders@supplyco.com',  phone: '+1-555-0201', address: '10 Vendor Blvd, WA', balance: 3000, createdAt: '2024-01-05' },
  { id: 'v2', name: 'TechParts Inc',   email: 'billing@techparts.com',phone: '+1-555-0202', address: '20 Industry Ln, OR', balance: 5000, createdAt: '2024-02-08' },
]

const SEED_INVOICES = [
  { id: 'inv1', number: 'INV-001', customerId: 'c1', date: '2024-06-01', dueDate: '2024-07-01', status: 'paid',    subtotal: 5000, tax: 500, total: 5500, items: [{ description: 'Consulting', qty: 10, price: 500 }], notes: '' },
  { id: 'inv2', number: 'INV-002', customerId: 'c2', date: '2024-07-15', dueDate: '2024-08-15', status: 'sent',    subtotal: 7200, tax: 720, total: 7920, items: [{ description: 'Software License', qty: 6, price: 1200 }], notes: '' },
  { id: 'inv3', number: 'INV-003', customerId: 'c3', date: '2024-08-01', dueDate: '2024-09-01', status: 'overdue', subtotal: 3000, tax: 300, total: 3300, items: [{ description: 'Support', qty: 3, price: 1000 }], notes: '' },
]

const SEED_BILLS = [
  { id: 'bill1', number: 'BILL-001', vendorId: 'v1', date: '2024-06-10', dueDate: '2024-07-10', status: 'paid',    subtotal: 3000, tax: 0,  total: 3000, items: [{ description: 'Office Supplies', qty: 1, price: 3000 }], notes: '' },
  { id: 'bill2', number: 'BILL-002', vendorId: 'v2', date: '2024-07-20', dueDate: '2024-08-20', status: 'open',    subtotal: 5000, tax: 0,  total: 5000, items: [{ description: 'Hardware Components', qty: 5, price: 1000 }], notes: '' },
]

const SEED_EXPENSES = [
  { id: 'exp1', date: '2024-06-05', category: 'Rent',      accountId: '10', amount: 2000, description: 'June office rent',        payee: 'Landlord Corp' },
  { id: 'exp2', date: '2024-06-15', category: 'Utilities', accountId: '12', amount: 450,  description: 'Electricity bill',        payee: 'City Power' },
  { id: 'exp3', date: '2024-07-01', category: 'Salaries',  accountId: '11', amount: 6000, description: 'July payroll',             payee: 'Payroll' },
  { id: 'exp4', date: '2024-07-10', category: 'Travel',    accountId: '1',  amount: 850,  description: 'Client meeting flights',   payee: 'Delta Airlines' },
]

const SEED_JOURNAL_ENTRIES = [
  {
    id: 'je1', date: '2024-06-01', reference: 'JE-001', description: 'Initial capital contribution',
    lines: [
      { accountId: '1', debit: 50000, credit: 0 },
      { accountId: '7', debit: 0,     credit: 50000 },
    ],
  },
  {
    id: 'je2', date: '2024-06-15', reference: 'JE-002', description: 'Recorded sales revenue',
    lines: [
      { accountId: '2', debit: 5500, credit: 0 },
      { accountId: '8', debit: 0,    credit: 5000 },
      { accountId: '1', debit: 0,    credit: 500 }, // tax liability simplified
    ],
  },
]

// ── store ──────────────────────────────────────────────────────────────────
const useStore = create(
  persist(
    (set, get) => ({
      // ── state ──
      accounts: SEED_ACCOUNTS,
      customers: SEED_CUSTOMERS,
      vendors: SEED_VENDORS,
      invoices: SEED_INVOICES,
      bills: SEED_BILLS,
      expenses: SEED_EXPENSES,
      journalEntries: SEED_JOURNAL_ENTRIES,
      company: { name: 'Ahmed Accounting Co.', currency: 'USD', fiscalYear: 'January', email: 'info@ahmedco.com', phone: '+1-555-1000', address: '1 Business Park, Suite 100' },

      // ── accounts ──
      addAccount: (account) => set((s) => ({ accounts: [...s.accounts, { ...account, id: uuidv4(), balance: 0 }] })),
      updateAccount: (id, data) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...data } : a)) })),
      deleteAccount: (id) => set((s) => ({ accounts: s.accounts.filter((a) => a.id !== id) })),

      // ── customers ──
      addCustomer: (c) => set((s) => ({ customers: [...s.customers, { ...c, id: uuidv4(), balance: 0, createdAt: dayjs().format('YYYY-MM-DD') }] })),
      updateCustomer: (id, data) => set((s) => ({ customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((c) => c.id !== id) })),

      // ── vendors ──
      addVendor: (v) => set((s) => ({ vendors: [...s.vendors, { ...v, id: uuidv4(), balance: 0, createdAt: dayjs().format('YYYY-MM-DD') }] })),
      updateVendor: (id, data) => set((s) => ({ vendors: s.vendors.map((v) => (v.id === id ? { ...v, ...data } : v)) })),
      deleteVendor: (id) => set((s) => ({ vendors: s.vendors.filter((v) => v.id !== id) })),

      // ── invoices ──
      addInvoice: (inv) => {
        const s = get()
        const number = `INV-${String(s.invoices.length + 1).padStart(3, '0')}`
        const total = inv.subtotal + (inv.subtotal * (inv.taxRate || 0)) / 100
        set((s) => ({ invoices: [...s.invoices, { ...inv, id: uuidv4(), number, total, status: 'draft' }] }))
      },
      updateInvoice: (id, data) => set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...data } : i)) })),
      deleteInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),

      // ── bills ──
      addBill: (bill) => {
        const s = get()
        const number = `BILL-${String(s.bills.length + 1).padStart(3, '0')}`
        set((s) => ({ bills: [...s.bills, { ...bill, id: uuidv4(), number, status: 'open' }] }))
      },
      updateBill: (id, data) => set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
      deleteBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),

      // ── expenses ──
      addExpense: (exp) => set((s) => ({ expenses: [...s.expenses, { ...exp, id: uuidv4() }] })),
      updateExpense: (id, data) => set((s) => ({ expenses: s.expenses.map((e) => (e.id === id ? { ...e, ...data } : e)) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),

      // ── journal entries ──
      addJournalEntry: (je) => {
        const s = get()
        const reference = `JE-${String(s.journalEntries.length + 1).padStart(3, '0')}`
        set((s) => ({ journalEntries: [...s.journalEntries, { ...je, id: uuidv4(), reference }] }))
      },
      deleteJournalEntry: (id) => set((s) => ({ journalEntries: s.journalEntries.filter((j) => j.id !== id) })),

      // ── company ──
      updateCompany: (data) => set((s) => ({ company: { ...s.company, ...data } })),
    }),
    { name: 'ahmed-accounting-storage' }
  )
)

export default useStore
