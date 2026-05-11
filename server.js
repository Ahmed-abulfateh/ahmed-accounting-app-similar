import express from 'express'
import cors from 'cors'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { MongoClient } from 'mongodb'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 4000)
const allowedOrigins = buildAllowedOrigins(process.env.FRONTEND_URL || 'http://localhost:5173')
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
const MONGODB_URI = process.env.MONGODB_URI
const MAX_WORKSPACE_PAYLOAD_BYTES = 2 * 1024 * 1024

// Allow all localhost ports in development
const isDevEnv = process.env.NODE_ENV !== 'production'
const localhostPattern = /^http:\/\/localhost:\d+$/
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.join(__dirname, 'dist')

// Simple in-memory user store (use MongoDB in production)
const users = new Map()
const workspaces = new Map()
let mongoDb = null

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin) and configured frontend origins.
    // In development, allow all localhost origins
    if (!origin || allowedOrigins.includes(origin) || (isDevEnv && localhostPattern.test(origin))) {
      callback(null, true)
      return
    }
    callback(new Error(`CORS blocked for origin: ${origin}`))
  },
}))
app.use(express.json({ limit: '2mb' }))

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// JWT middleware - verify token and add user info to request
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ ok: false, message: 'No token provided' })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.userId = decoded.userId
    next()
  } catch (error) {
    return res.status(401).json({ ok: false, message: 'Invalid token' })
  }
}

// Auth endpoints
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ ok: false, message: 'Missing email, password, or name' })
    }
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'Email already registered' })
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 6 characters' })
    }
    
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    
    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: hash,
      salt,
      createdAt: new Date().toISOString(),
    }
    await createUser(user)
    
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ 
      ok: true, 
      token, 
      user: { id: user.id, email: user.email, name: user.name } 
    })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Missing email or password' })
    }
    
    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' })
    }
    
    const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex')
    if (hash !== user.passwordHash) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' })
    }
    
    const token = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '7d' })
    res.json({ 
      ok: true, 
      token,
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/auth/verify', authMiddleware, async (req, res) => {
  try {
    const user = await findUserById(req.userId)
    
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' })
    }
    
    res.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name }
    })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.get('/api/workspace', authMiddleware, async (req, res) => {
  try {
    const workspace = await getWorkspace(req.userId)
    res.json({ ok: true, workspace })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.put('/api/workspace', authMiddleware, async (req, res) => {
  try {
    const { workspace } = req.body || {}
    if (!workspace || typeof workspace !== 'object') {
      return res.status(400).json({ ok: false, message: 'Invalid workspace payload' })
    }

    const normalizedWorkspace = normalizeWorkspace(workspace)
    await saveWorkspace(req.userId, normalizedWorkspace)
    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message })
  }
})

app.post('/api/auth/logout', (_req, res) => {
  // Logout is handled client-side (remove token from localStorage)
  res.json({ ok: true, message: 'Logged out' })
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

// Serve frontend for single-service deployments (e.g. Render web service).
app.use(express.static(distPath))
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

startServer()

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

function buildAllowedOrigins(rawOriginValue) {
  return rawOriginValue
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

async function startServer() {
  if (!JWT_SECRET || JWT_SECRET === 'dev-secret-key-change-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be set to a strong value in production')
    }
    console.warn('Using default JWT secret in development. Set JWT_SECRET for safer local testing.')
  }

  await connectDatabase()
  app.listen(PORT, () => {
    const storageMode = mongoDb ? 'MongoDB' : 'in-memory fallback'
    console.log(`Mailer API running on http://localhost:${PORT} (${storageMode})`)
  })
}

async function connectDatabase() {
  if (!MONGODB_URI) {
    return
  }

  try {
    const client = new MongoClient(MONGODB_URI)
    await client.connect()
    mongoDb = client.db()
    await ensureMongoIndexes()
  } catch (error) {
    console.error('MongoDB connection failed, using in-memory fallback:', error.message)
    mongoDb = null
  }
}

async function ensureMongoIndexes() {
  if (!mongoDb) {
    return
  }

  await mongoDb.collection('users').createIndex({ email: 1 }, { unique: true })
  await mongoDb.collection('users').createIndex({ id: 1 }, { unique: true })
  await mongoDb.collection('workspaces').createIndex({ userId: 1 }, { unique: true })
}

async function findUserByEmail(email) {
  if (mongoDb) {
    return mongoDb.collection('users').findOne({ email })
  }
  return users.get(email)
}

async function findUserById(id) {
  if (mongoDb) {
    return mongoDb.collection('users').findOne({ id })
  }

  for (const user of users.values()) {
    if (user.id === id) {
      return user
    }
  }

  return null
}

async function createUser(user) {
  if (mongoDb) {
    await mongoDb.collection('users').insertOne(user)
    return
  }
  users.set(user.email, user)
}

async function getWorkspace(userId) {
  if (mongoDb) {
    const doc = await mongoDb.collection('workspaces').findOne({ userId })
    return doc?.workspace || null
  }
  return workspaces.get(userId) || null
}

async function saveWorkspace(userId, workspace) {
  const size = Buffer.byteLength(JSON.stringify(workspace), 'utf8')
  if (size > MAX_WORKSPACE_PAYLOAD_BYTES) {
    throw new Error('Workspace payload too large')
  }

  if (mongoDb) {
    await mongoDb.collection('workspaces').updateOne(
      { userId },
      {
        $set: {
          userId,
          workspace,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    )
    return
  }

  workspaces.set(userId, workspace)
}

function normalizeWorkspace(workspace) {
  return {
    accounts: asArray(workspace.accounts),
    customers: asArray(workspace.customers),
    vendors: asArray(workspace.vendors),
    invoices: asArray(workspace.invoices),
    bills: asArray(workspace.bills),
    expenses: asArray(workspace.expenses),
    journalEntries: asArray(workspace.journalEntries),
    company: asObject(workspace.company),
    appSettings: asObject(workspace.appSettings),
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}
