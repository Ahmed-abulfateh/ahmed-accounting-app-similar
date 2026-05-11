import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import useStore from '../../store/useStore'
import PageHeader from '../../components/ui/PageHeader'
import Modal from '../../components/ui/Modal'
import { fmt, fmtDate } from '../../utils/format'
import { Plus, Pencil, Trash2, Search, Mail, Phone, Upload, FileSpreadsheet } from 'lucide-react'

const emptyForm = { name: '', email: '', phone: '', address: '' }
const CUSTOMER_IMPORT_SCHEMA = [
  { column: 'name', required: 'Yes', notes: 'Customer or company name' },
  { column: 'email', required: 'No', notes: 'Billing/contact email' },
  { column: 'phone', required: 'No', notes: 'Phone number' },
  { column: 'address', required: 'No', notes: 'Postal address' },
  { column: 'balance', required: 'No', notes: 'Opening balance, default 0' },
  { column: 'createdAt', required: 'No', notes: 'Date in YYYY-MM-DD, default today' },
]

const CUSTOMER_IMPORT_EXAMPLE_ROWS = [
  {
    name: 'Acme Corp',
    email: 'billing@acme.com',
    phone: '+1-555-0101',
    address: '123 Main St, NY',
    balance: 4500,
    createdAt: '2024-01-10',
  },
  {
    name: 'Globex Ltd',
    email: 'accounts@globex.com',
    phone: '+1-555-0102',
    address: '456 Oak Ave, CA',
    balance: 0,
    createdAt: '2024-02-15',
  },
]

export default function CustomersList() {
  const customers      = useStore((s) => s.customers)
  const invoices       = useStore((s) => s.invoices)
  const addCustomer    = useStore((s) => s.addCustomer)
  const addCustomersBulk = useStore((s) => s.addCustomersBulk)
  const updateCustomer = useStore((s) => s.updateCustomer)
  const deleteCustomer = useStore((s) => s.deleteCustomer)

  const [modal, setModal]     = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(emptyForm)
  const [search, setSearch]   = useState('')
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  const customerBalance = (id) => invoices.filter(i => i.customerId === id && i.status !== 'paid').reduce((a, b) => a + b.total, 0)
  const invoiceCount = (id) => invoices.filter(i => i.customerId === id).length

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const openAdd  = () => { setForm(emptyForm); setEditing(null); setModal('form') }
  const openEdit = (c) => { setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address }); setEditing(c.id); setModal('form') }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editing) updateCustomer(editing, form)
    else addCustomer(form)
    setModal(null)
  }

  const downloadTemplate = () => {
    const rows = [
      ['name', 'email', 'phone', 'address', 'balance', 'createdAt'],
      ['Acme Corp', 'billing@acme.com', '+1-555-0101', '123 Main St, NY', 4500, '2024-01-10'],
      ['Globex Ltd', 'accounts@globex.com', '+1-555-0102', '456 Oak Ave, CA', 0, '2024-02-15'],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Customers')
    XLSX.writeFile(wb, 'customers-import-template.xlsx')
  }

  const triggerFilePicker = () => {
    fileInputRef.current?.click()
  }

  const handleImportExcel = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

      if (!rows.length) {
        setImportResult({ imported: 0, skipped: 0, message: 'Sheet is empty.' })
        return
      }

      const headers = rows[0].map((h) => normalizeHeader(h))
      const dataRows = rows.slice(1)
      const parsedCustomers = []
      let skipped = 0

      dataRows.forEach((row) => {
        const record = {}
        headers.forEach((key, index) => {
          record[key] = row[index]
        })

        const name = String(record.name || '').trim()
        if (!name) {
          skipped += 1
          return
        }

        const createdAt = parseExcelDate(record.createdat)
        parsedCustomers.push({
          name,
          email: String(record.email || '').trim(),
          phone: String(record.phone || '').trim(),
          address: String(record.address || '').trim(),
          balance: Number(record.balance || 0),
          createdAt,
        })
      })

      if (!parsedCustomers.length) {
        setImportResult({ imported: 0, skipped, message: 'No valid customer rows found. Make sure the name column is filled.' })
        return
      }

      addCustomersBulk(parsedCustomers)
      setImportResult({
        imported: parsedCustomers.length,
        skipped,
        message: `Imported ${parsedCustomers.length} customers${skipped ? `, skipped ${skipped}` : ''}.`,
      })
    } catch (error) {
      setImportResult({ imported: 0, skipped: 0, message: `Import failed: ${error.message}` })
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Customers"
        subtitle="Manage your customer contacts"
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportExcel}
              className="hidden"
            />
            <button className="btn-secondary text-xs sm:text-sm" onClick={downloadTemplate}><FileSpreadsheet size={16} /> Template</button>
            <button className="btn-secondary text-xs sm:text-sm" onClick={triggerFilePicker}><Upload size={16} /> Import Excel</button>
            <button className="btn-primary text-xs sm:text-sm" onClick={openAdd}><Plus size={16} /> New</button>
          </>
        }
      />

      {importResult && (
        <div className="card p-4 mb-5 text-sm">
          <p className="font-semibold text-slate-800">Excel Import Result</p>
          <p className="text-slate-600 mt-1">{importResult.message}</p>
        </div>
      )}

      <div className="card mb-5 overflow-hidden">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50">
          <p className="font-semibold text-sm sm:text-base text-slate-800">Excel Upload Schema (Customers Sheet)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-3 sm:px-4 py-2.5 font-medium">Column</th>
                <th className="px-3 sm:px-4 py-2.5 font-medium">Required</th>
                <th className="px-3 sm:px-4 py-2.5 font-medium hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CUSTOMER_IMPORT_SCHEMA.map((item) => (
                <tr key={item.column}>
                  <td className="px-3 sm:px-4 py-2.5 font-mono text-slate-700 text-xs">{item.column}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-slate-700">{item.required}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-slate-500 hidden sm:table-cell text-xs">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-slate-200 bg-slate-50">
          <p className="font-semibold text-sm sm:text-base text-slate-800">Example Upload Table (2 Customers)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-slate-500">
                <th className="px-3 sm:px-4 py-2.5 font-medium">name</th>
                <th className="px-3 sm:px-4 py-2.5 font-medium hidden sm:table-cell">email</th>
                <th className="px-3 sm:px-4 py-2.5 font-medium hidden lg:table-cell">phone</th>
                <th className="px-3 sm:px-4 py-2.5 font-medium hidden lg:table-cell">address</th>
                <th className="px-3 sm:px-4 py-2.5 font-medium">balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {CUSTOMER_IMPORT_EXAMPLE_ROWS.map((row, index) => (
                <tr key={`${row.email}-${index}`}>
                  <td className="px-3 sm:px-4 py-2.5 text-slate-700 truncate text-xs">{row.name}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-slate-700 hidden sm:table-cell truncate text-xs">{row.email}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-slate-700 hidden lg:table-cell truncate text-xs">{row.phone}</td>
                  <td className="px-3 sm:px-4 py-2.5 text-slate-700 hidden lg:table-cell truncate text-xs">{row.address}</td>
                  <td className="px-3 sm:px-4 py-2.5 font-mono text-slate-700 text-xs">{row.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input className="form-input pl-9 w-full text-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="card p-4 sm:p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg mb-2">
                  {c.name[0]}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm truncate">{c.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">Since {fmtDate(c.createdAt)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button 
                  onClick={() => openEdit(c)} 
                  className="btn-small bg-white border border-gray-200 text-gray-400 hover:text-blue-600"
                  title="Edit customer"
                  aria-label="Edit customer"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => deleteCustomer(c.id)} 
                  className="btn-small bg-white border border-gray-200 text-gray-400 hover:text-red-600"
                  title="Delete customer"
                  aria-label="Delete customer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-gray-500 mb-4">
              {c.email && <div className="flex items-center gap-2 truncate"><Mail size={13} /><span className="truncate">{c.email}</span></div>}
              {c.phone && <div className="flex items-center gap-2 truncate"><Phone size={13} /><span className="truncate">{c.phone}</span></div>}
            </div>
            <div className="pt-4 border-t border-gray-100 flex justify-between text-xs">
              <span className="text-gray-500">{invoiceCount(c.id)} invoices</span>
              <span className={`font-semibold ${customerBalance(c.id) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {fmt(customerBalance(c.id))} outstanding
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-10 text-sm">No customers found</p>
        )}
      </div>

      {modal === 'form' && (
        <Modal title={editing ? 'Edit Customer' : 'New Customer'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Name *</label>
              <input className="form-input text-base" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company or person name" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input text-base" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="billing@example.com" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input text-base" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1-555-0000" />
            </div>
            <div>
              <label className="form-label">Address</label>
              <textarea className="form-input text-base" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" className="btn-secondary text-sm" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary text-sm">{editing ? 'Save Changes' : 'Create Customer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('_', '')
}

function parseExcelDate(value) {
  const text = String(value || '').trim()
  if (!text) return undefined

  // Numeric Excel date serial support.
  if (!Number.isNaN(Number(text)) && text.length < 8) {
    const parsed = XLSX.SSF.parse_date_code(Number(text))
    if (parsed) {
      const month = String(parsed.m).padStart(2, '0')
      const day = String(parsed.d).padStart(2, '0')
      return `${parsed.y}-${month}-${day}`
    }
  }

  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString().slice(0, 10)
}
