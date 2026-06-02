import App from './App'
import AppProviders from './components/AppProviders'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import QuestionsFeed from './pages/QuestionsFeed'
import AskQuestionPage from './pages/AskQuestionPage'
import QuestionDetailPage from './pages/QuestionDetailPage'
import UserProfilePage from './pages/UserProfilePage'
import AdminDashboard from './pages/AdminDashboard'
import TagManagementPage from './pages/TagManagementPage'
import SettingsPage from './pages/SettingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import ProfileRedirect from './components/ProfileRedirect'

const routes = [
  {
    path: '/',
    element: (
      <AppProviders>
        <App />
      </AppProviders>
    ),
    children: [
      {
        index: true,
        element: <LandingPage />
      },
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        path: 'signup',
        element: <SignUpPage />
      },
      {
        path: 'auth/callback',
        element: <AuthCallbackPage />
      },
      {
        path: 'questions',
        element: <Layout><QuestionsFeed /></Layout>
      },
      {
        path: 'questions/:id',
        element: <Layout><QuestionDetailPage /></Layout>
      },
      {
        path: 'ask',
        element: <ProtectedRoute><Layout><AskQuestionPage /></Layout></ProtectedRoute>
      },
      {
        path: 'profile',
        element: <ProfileRedirect />
      },
      {
        path: 'profile/:username',
        element: <Layout><UserProfilePage /></Layout>
      },
      {
        path: 'settings',
        element: <ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>
      },
      {
        path: 'admin',
        element: <AdminRoute><Layout><AdminDashboard /></Layout></AdminRoute>
      },
      {
        path: 'admin/tags',
        element: <AdminRoute><Layout><TagManagementPage /></Layout></AdminRoute>
      }
    ]
  }
]

export default routes
