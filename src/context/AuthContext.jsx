import { createContext, useContext, useEffect, useState } from 'react'
import { switchStoreUser } from '../store/useStore'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('authToken'))
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyToken = async (t) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const res = await fetch(`${apiBase}/api/auth/verify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.ok) {
        const data = await res.json()
        await switchStoreUser(data.user.id)
        setUser(data.user)
      } else {
        logout()
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      logout()
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email, password, name) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const res = await fetch(`${apiBase}/api/auth/signup`, {
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
        return data
      }
      throw new Error(data.message || 'Signup failed')
    } catch (error) {
      throw error
    }
  }

  const login = async (email, password) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const res = await fetch(`${apiBase}/api/auth/login`, {
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
        return data
      }
      throw new Error(data.message || 'Login failed')
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    switchStoreUser(null)
    localStorage.removeItem('authToken')
    setToken(null)
    setUser(null)
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
