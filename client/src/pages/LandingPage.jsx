import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaGithub } from 'react-icons/fa'
import { 
  FiSearch, 
  FiUsers, 
  FiAward, 
  FiTrendingUp,
  FiArrowRight,
  FiCheckCircle
} from 'react-icons/fi'

const LandingPage = () => {
  const features = [
    {
      icon: FiSearch,
      title: 'Find Answers Fast',
      description: 'Search through thousands of questions and answers to find exactly what you need.'
    },
    {
      icon: FiUsers,
      title: 'Community Driven',
      description: 'Join a community of experts and learners sharing knowledge and helping each other.'
    },
    {
      icon: FiAward,
      title: 'Quality Content',
      description: 'Vote-based system ensures the best answers rise to the top.'
    },
    {
      icon: FiTrendingUp,
      title: 'Stay Updated',
      description: 'Real-time notifications keep you informed about new answers and comments.'
    }
  ]

  const sampleQuestions = [
    {
      title: 'How to implement authentication in React?',
      answers: 12,
      votes: 45,
      tags: ['react', 'authentication', 'javascript']
    },
    {
      title: 'Best practices for API design in Node.js',
      answers: 8,
      votes: 32,
      tags: ['nodejs', 'api', 'backend']
    },
    {
      title: 'Understanding async/await in JavaScript',
      answers: 15,
      votes: 67,
      tags: ['javascript', 'async', 'promises']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 dark:from-navy-900 dark:to-navy-800">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-3xl font-bold gradient-text">
            StackIt
          </Link>
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/Ashmita1206/StackIt"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-navy-700 hover:text-primary-600 dark:text-navy-200 dark:hover:text-primary-400 transition-colors"
            >
              <FaGithub className="w-6 h-6" />
            </a>
            <Link to="/login" className="btn-outline">
              Sign In
            </Link>
            <Link to="/signup" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-navy-900 dark:text-white mb-6">
              The Professional
              <span className="gradient-text block">Q&A Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-navy-600 dark:text-navy-300 mb-8 max-w-3xl mx-auto">
              Ask questions, share knowledge, and build your reputation in a community of experts and learners.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary text-lg px-8 py-4 inline-flex items-center">
                Start Asking Questions
                <FiArrowRight className="ml-2" />
              </Link>
              <Link to="/questions" className="btn-outline text-lg px-8 py-4">
                Browse Questions
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-2xl opacity-20 blur-3xl"></div>
            <div className="relative bg-white dark:bg-navy-800 rounded-2xl shadow-2xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sampleQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className="card p-6 hover:shadow-lg transition-shadow"
                  >
                    <h3 className="font-semibold text-navy-900 dark:text-white mb-3 line-clamp-2">
                      {question.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-navy-500 dark:text-navy-400">
                      <span>{question.answers} answers</span>
                      <span>{question.votes} votes</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {question.tags.map((tag, tagIndex) => (
                        <span key={tagIndex} className="badge badge-primary text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-white dark:bg-navy-900">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-navy-900 dark:text-white mb-4">
              Why Choose StackIt?
            </h2>
            <p className="text-xl text-navy-600 dark:text-navy-300 max-w-2xl mx-auto">
              Built for professionals, designed for learning. Join thousands of users who trust StackIt for their Q&A needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-navy-600 dark:text-navy-300">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join our community today and start asking questions, sharing knowledge, and building your reputation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center">
                Create Free Account
                <FiArrowRight className="ml-2" />
              </Link>
              <Link to="/questions" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-8 rounded-lg transition-colors">
                Explore Questions
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-navy-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold gradient-text mb-4">StackIt</h3>
              <p className="text-navy-300">
                The professional Q&A platform for collaborative learning and knowledge sharing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-navy-300">
                <li><Link to="/questions" className="hover:text-white transition-colors">Questions</Link></li>
                <li><Link to="/tags" className="hover:text-white transition-colors">Tags</Link></li>
                <li><Link to="/users" className="hover:text-white transition-colors">Users</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-navy-300">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/feedback" className="hover:text-white transition-colors">Feedback</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-navy-300">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-navy-700 mt-8 pt-8 text-center text-navy-300">
            <p>&copy; {new Date().getFullYear()} StackIt. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 
