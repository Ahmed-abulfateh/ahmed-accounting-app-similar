import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 4000)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(cors({ origin: FRONTEND_URL }))
app.use(express.json())

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'mailer-api' })
})

app.post('/api/email/invoice-status', async (req, res) => {
  try {
    const {
      email,
      customerName,
      invoiceNumber,
      total,
      dueDate,
      invoiceDate,
      status,
      companyName,
    } = req.body || {}

    if (!email || !invoiceNumber || !status) {
      return res.status(400).json({ ok: false, message: 'Missing required fields: email, invoiceNumber, status' })
    }

    const fromAddress = process.env.WORKSPACE_EMAIL || process.env.SMTP_USER
    if (!fromAddress) {
      return res.status(500).json({ ok: false, message: 'Sender email is not configured in WORKSPACE_EMAIL or SMTP_USER' })
    }

    const { subject, text, html } = buildInvoiceEmail({
      status,
      customerName,
      invoiceNumber,
      total,
      dueDate,
      invoiceDate,
      companyName,
    })

    await transporter.sendMail({
      from: fromAddress,
      to: email,
      subject,
      text,
      html,
    })

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Failed to send email' })
  }
})

app.listen(PORT, () => {
  console.log(`Mailer API running on http://localhost:${PORT}`)
})

function buildInvoiceEmail({ status, customerName, invoiceNumber, total, dueDate, invoiceDate, companyName }) {
  const name = customerName || 'Customer'
  const company = companyName || 'Accounting Team'
  const amount = total ?? 'N/A'
  const safeDue = dueDate || 'N/A'
  const safeDate = invoiceDate || 'N/A'

  if (status === 'paid') {
    const subject = `Payment received for invoice ${invoiceNumber}`
    const text = `Hi ${name},\n\nWe have received your payment for invoice ${invoiceNumber}.\nAmount: ${amount}\nInvoice date: ${safeDate}\n\nThank you,\n${company}`
    const html = `<p>Hi ${escapeHtml(name)},</p><p>We have received your payment for invoice <strong>${escapeHtml(invoiceNumber)}</strong>.</p><p><strong>Amount:</strong> ${escapeHtml(String(amount))}<br/><strong>Invoice date:</strong> ${escapeHtml(safeDate)}</p><p>Thank you,<br/>${escapeHtml(company)}</p>`
    return { subject, text, html }
  }

  if (status === 'reminder') {
    const subject = `Payment reminder: invoice ${invoiceNumber} is due` 
    const text = `Hi ${name},\n\nThis is a friendly reminder that invoice ${invoiceNumber} is due on ${safeDue}.\nAmount due: ${amount}\n\nPlease complete payment by the due date.\n\nRegards,\n${company}`
    const html = `<p>Hi ${escapeHtml(name)},</p><p>This is a friendly reminder that invoice <strong>${escapeHtml(invoiceNumber)}</strong> is due on <strong>${escapeHtml(safeDue)}</strong>.</p><p><strong>Amount due:</strong> ${escapeHtml(String(amount))}</p><p>Please complete payment by the due date.</p><p>Regards,<br/>${escapeHtml(company)}</p>`
    return { subject, text, html }
  }

  const subject = `Invoice ${invoiceNumber} from ${company}`
  const text = `Hi ${name},\n\nYour invoice ${invoiceNumber} has been issued.\nInvoice date: ${safeDate}\nDue date: ${safeDue}\nAmount due: ${amount}\n\nPlease pay on or before the due date.\n\nRegards,\n${company}`
  const html = `<p>Hi ${escapeHtml(name)},</p><p>Your invoice <strong>${escapeHtml(invoiceNumber)}</strong> has been issued.</p><p><strong>Invoice date:</strong> ${escapeHtml(safeDate)}<br/><strong>Due date:</strong> ${escapeHtml(safeDue)}<br/><strong>Amount due:</strong> ${escapeHtml(String(amount))}</p><p>Please pay on or before the due date.</p><p>Regards,<br/>${escapeHtml(company)}</p>`
  return { subject, text, html }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}
