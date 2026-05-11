export const fmt = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount ?? 0)

export const fmtDate = (d) => {
  if (!d) return '—'
  try {
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(d))
  } catch {
    return d
  }
}

export const statusBadge = (status) => {
  const map = {
    paid: 'badge-green', sent: 'badge-blue', draft: 'badge-gray',
    overdue: 'badge-red', open: 'badge-yellow', partial: 'badge-yellow', void: 'badge-gray',
  }
  return map[status] ?? 'badge-gray'
}
