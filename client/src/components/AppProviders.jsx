import { ThemeProvider } from '../contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'
import { SocketProvider } from '../contexts/SocketContext'
import { Toaster } from 'react-hot-toast'

const AppProviders = ({ children }) => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.15)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#f0fdf4',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fef2f2',
                },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default AppProviders 