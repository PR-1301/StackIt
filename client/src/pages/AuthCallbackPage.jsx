import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const AuthCallbackPage = () => {
  const [error, setError] = useState('')
  const { completeOAuthLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const queryParams = new URLSearchParams(window.location.search)
    const token = hashParams.get('token')
    const provider = hashParams.get('provider') || queryParams.get('provider')
    const oauthError = queryParams.get('error')

    if (oauthError) {
      setError('OAuth sign in failed. Please try again.')
      return
    }

    if (!token) {
      setError('OAuth sign in did not return a token.')
      return
    }

    completeOAuthLogin(token, provider)
  }, [completeOAuthLogin, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-navy-900 dark:to-navy-800 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8 text-center"
      >
        <Link
          to="/"
          className="text-3xl font-bold gradient-text mb-6 block"
        >
          StackIt
        </Link>

        {error ? (
          <>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
              Sign in failed
            </h1>
            <p className="text-navy-600 dark:text-navy-300 mt-3">
              {error}
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-6 btn-primary py-3 px-5 inline-flex items-center"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto"></div>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white mt-6">
              Completing sign in
            </h1>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default AuthCallbackPage
