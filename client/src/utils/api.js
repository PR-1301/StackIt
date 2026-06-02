import axios from 'axios'

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || 'Authentication failed'

      // Only redirect if it's a token-related error, not other auth issues
      if (errorMessage.includes('token') || errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpiry')
        localStorage.removeItem('cachedUser')

        // Use a flag to prevent multiple redirects
        if (!window.isRedirecting) {
          window.isRedirecting = true
          setTimeout(() => {
            window.location.href = '/login'
            window.isRedirecting = false
          }, 100)
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
