import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser, FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: 'bg-gray-200 dark:bg-navy-600' }
  let score = 0
  if (password.length >= 8) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score < 3) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score < 5) return { score, label: 'Medium', color: 'bg-yellow-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signup, startOAuthLogin } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm()

  const password = watch('password')
  const strength = calculatePasswordStrength(password)

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await signup({
        username: data.username,
        email: data.email,
        password: data.password,
      })
      if (result.success) {
        navigate('/questions')
      }
    } catch (error) {
      console.error('Signup error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-navy-900 dark:to-navy-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex items-center text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white mb-8 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-navy-800 rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bold gradient-text mb-2 block">
              StackIt
            </Link>
            <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
              Create your account
            </h1>
            <p className="text-navy-600 dark:text-navy-300 mt-2">
              Join our community and start asking questions
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Username
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-5 h-5" />
                <input
                  id="username"
                  type="text"
                  {...register('username', {
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters',
                    },
                    maxLength: {
                      value: 20,
                      message: 'Username must be less than 20 characters',
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Username can only contain letters, numbers, and underscores',
                    },
                  })}
                  className="input-field pl-10"
                  placeholder="Choose a username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-5 h-5" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                    },
                  })}
                  className="input-field pl-10 pr-10"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password strength meter */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-navy-600 dark:text-navy-300">Password strength:</span>
                    <span className={`font-semibold ${
                      strength.label === 'Weak' ? 'text-red-500' :
                      strength.label === 'Medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 dark:bg-navy-600 rounded-full overflow-hidden flex gap-1">
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-gray-200 dark:bg-navy-600'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-gray-200 dark:bg-navy-600'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-gray-200 dark:bg-navy-600'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-gray-200 dark:bg-navy-600'}`} />
                    <div className={`h-full flex-1 rounded-full transition-all duration-300 ${strength.score >= 5 ? strength.color : 'bg-gray-200 dark:bg-navy-600'}`} />
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match',
                  })}
                  className="input-field pl-10 pr-10"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
                >
                  {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                {...register('terms', {
                  required: 'You must accept the terms and conditions',
                })}
                className="mt-1 rounded border-navy-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-navy-600 dark:text-navy-300">
                I agree to the{' '}
                <Link
                  to="/terms"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.terms.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-navy-600 dark:text-navy-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Social login options */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-navy-200 dark:border-navy-700" />
              </div>

              <div className="relative flex justify-center">
                <span className="px-4 bg-white dark:bg-navy-800 text-sm text-navy-500 dark:text-navy-400">
                  Continue with
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {/* Google Login */}
              <button
                type="button"
                onClick={() => startOAuthLogin('google')}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-navy-300 dark:border-navy-600 rounded-lg shadow-sm bg-white dark:bg-navy-700 text-sm font-medium text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-600 hover:scale-[1.01] transition-all duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>

                <span>Continue with Google</span>
              </button>

              {/* X Login */}
              <button
                type="button"
                onClick={() => startOAuthLogin('twitter')}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-navy-300 dark:border-navy-600 rounded-lg shadow-sm bg-white dark:bg-navy-700 text-sm font-medium text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-600 hover:scale-[1.01] transition-all duration-200"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M18.901 1.153H22.58L14.543 10.34L24 22.847H16.594L10.793 15.261L4.151 22.847H0.469L9.067 13.02L0 1.154H7.594L12.838 8.046L18.901 1.153ZM17.61 20.645H19.649L6.486 3.24H4.298L17.61 20.645Z" />
                </svg>

                <span>Continue with X</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default SignUpPage
