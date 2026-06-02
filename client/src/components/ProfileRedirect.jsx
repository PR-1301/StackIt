import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProfileRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={`/profile/${user.username}`} replace />
}

export default ProfileRedirect
