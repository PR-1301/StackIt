import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import api, { API_BASE_URL } from '../utils/api'

const AuthContext = createContext();

// Session duration: 7 days in milliseconds
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

const saveSession = (token, userData) => {
  localStorage.setItem('token', token)
  localStorage.setItem('tokenExpiry', String(Date.now() + SESSION_DURATION_MS))
  localStorage.setItem('cachedUser', JSON.stringify(userData))
}

const clearSession = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('tokenExpiry')
  localStorage.removeItem('cachedUser')
  delete api.defaults.headers.common['Authorization']
}

const isSessionValid = () => {
  const token = localStorage.getItem('token')
  const expiry = localStorage.getItem('tokenExpiry')
  if (!token || !expiry) return false
  return Date.now() < Number(expiry)
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Restore user from cache immediately to prevent flash of logged-out state
    if (isSessionValid()) {
      try {
        const cached = localStorage.getItem('cachedUser')
        return cached ? JSON.parse(cached) : null
      } catch {
        return null
      }
    }
    return null
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!isSessionValid()) {
        clearSession()
        setUser(null)
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Validate token with server in the background
      const response = await api.get('/auth/me')
      const freshUser = response.data.user
      setUser(freshUser)
      // Update the cached user with fresh data
      localStorage.setItem('cachedUser', JSON.stringify(freshUser))
    } catch (error) {
      // Only clear session if it's a token-related error
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || ''
        if (errorMessage.includes('token') || errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
          clearSession()
          setUser(null)
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data

      saveSession(token, user)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)

      toast.success('Welcome back!')
      navigate('/questions')
      return { success: true }
    } catch (error) {
      let message = error.response?.data?.message || 'Login failed'
      if (message === 'Validation failed' && error.response?.data?.errors?.length > 0) {
        message = error.response.data.errors[0].msg
      }
      toast.error(message)
      return { success: false, error: message }
    }
  };

  const signup = async userData => {
    try {
      const response = await api.post('/auth/signup', userData)
      const { token, user } = response.data

      saveSession(token, user)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)

      toast.success('Account created successfully!')
      navigate('/questions')
      return { success: true }
    } catch (error) {
      let message = error.response?.data?.message || 'Signup failed'
      if (message === 'Validation failed' && error.response?.data?.errors?.length > 0) {
        message = error.response.data.errors[0].msg
      }
      toast.error(message)
      return { success: false, error: message }
    }
  };

  const startOAuthLogin = useCallback((provider) => {
    const apiBaseUrl = API_BASE_URL.replace(/\/$/, '')
    window.location.assign(`${apiBaseUrl}/auth/${provider}`)
  }, [])

  const completeOAuthLogin = useCallback(async (token, provider) => {
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`

      const response = await api.get('/auth/me')
      const userData = response.data.user
      saveSession(token, userData)
      setUser(userData)

      const providerName = provider === 'twitter' ? 'Twitter' : 'Google'
      toast.success(`Signed in with ${providerName}`)
      navigate('/questions')
      return { success: true }
    } catch (error) {
      clearSession()
      setUser(null)

      const message = error.response?.data?.message || 'OAuth login failed'
      toast.error(message)
      navigate('/login')
      return { success: false, error: message }
    }
  }, [navigate])

  const logout = () => {
    clearSession()
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/')
  }

  const updateProfile = async userData => {
    try {
      const response = await api.put('/auth/profile', userData)
      const updatedUser = response.data.user
      setUser(updatedUser)
      localStorage.setItem('cachedUser', JSON.stringify(updatedUser))
      toast.success('Profile updated successfully')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    startOAuthLogin,
    completeOAuthLogin,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
