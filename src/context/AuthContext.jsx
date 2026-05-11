import { createContext, useContext, useEffect, useRef, useState } from 'react'
import useStore, { switchStoreUser } from '../store/useStore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('authToken'))
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef(null)
  const skipNextSaveRef = useRef(false)
  const hasVerifiedRef = useRef(false)
  const loggingOutRef = useRef(false)

  const getApiBase = () => import.meta.env.VITE_API_URL || 'http://localhost:4000'

  const clearPendingSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
  }

  const loadWorkspace = async (authToken) => {
    try {
      const res = await fetch(`${getApiBase()}/api/workspace`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (!res.ok) {
        return
      }
      const data = await res.json()
      if (data.ok && data.workspace) {
        skipNextSaveRef.current = true
        useStore.getState().importWorkspace(data.workspace)
      }
    } catch (_error) {
      // Best effort sync only; local store remains usable offline.
    }
  }

  const saveWorkspace = async (authToken, { keepalive = false } = {}) => {
    try {
      const workspace = useStore.getState().exportWorkspace()
      const res = await fetch(`${getApiBase()}/api/workspace`, {
        method: 'PUT',
        keepalive,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ workspace }),
      })

      if (res.status === 401 && !loggingOutRef.current) {
        await logout({ flush: false })
      }
    } catch (_error) {
      // Best effort sync only; next update will retry.
    }
  }

  // Verify token on mount
  useEffect(() => {
    if (hasVerifiedRef.current) {
      return
    }
    hasVerifiedRef.current = true

    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!user || !token) {
      return
    }

    const handleBeforeUnload = () => {
      clearPendingSave()
      saveWorkspace(token, { keepalive: true })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user, token])

  useEffect(() => {
    if (!user || !token) {
      return
    }

    const unsubscribe = useStore.subscribe(() => {
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false
        return
      }

      clearPendingSave()
      saveTimeoutRef.current = setTimeout(() => {
        saveWorkspace(token)
      }, 600)
    })

    return () => {
      unsubscribe()
      clearPendingSave()
    }
  }, [user, token])

  const verifyToken = async (t) => {
    try {
      const res = await fetch(`${getApiBase()}/api/auth/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const data = await res.json()
        await switchStoreUser(data.user.id)
        setUser(data.user)
        await loadWorkspace(t)
      } else {
        await logout({ flush: false })
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      await logout({ flush: false })
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email, password, name) => {
    try {
      const res = await fetch(`${getApiBase()}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (data.ok) {
        await switchStoreUser(data.user.id)
        localStorage.setItem('authToken', data.token)
        setToken(data.token)
        setUser(data.user)
        await loadWorkspace(data.token)
        return data
      }
      throw new Error(data.message || 'Signup failed')
    } catch (error) {
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const res = await fetch(`${getApiBase()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.ok) {
        await switchStoreUser(data.user.id)
        localStorage.setItem('authToken', data.token)
        setToken(data.token)
        setUser(data.user)
        await loadWorkspace(data.token)
        return data
      }
      throw new Error(data.message || 'Login failed')
    } catch (error) {
      throw error
    }
  }

  const logout = async ({ flush = true } = {}) => {
    loggingOutRef.current = true
    if (flush && user && token) {
      await saveWorkspace(token, { keepalive: true })
    }
    clearPendingSave()
    await switchStoreUser(null)
    localStorage.removeItem('authToken')
    setToken(null)
    setUser(null)
    loggingOutRef.current = false
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
