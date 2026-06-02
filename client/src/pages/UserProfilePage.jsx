import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiCalendar,
  FiAward,
  FiMessageSquare,
  FiThumbsUp,
  FiEye,
  FiTag,
  FiEdit,
  FiSettings,
  FiArrowLeft,
  FiCheck,
  FiX,
  FiStar,
  FiTrendingUp,
} from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import QuestionCard from '../components/QuestionCard';

const UserProfilePage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('questions');

  // Fetch user profile data
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery(
    ['user-profile', username],
    () => api.get(`api/users/profile/${username}`).then(res => res.data),
    {
      staleTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-navy-200 dark:bg-navy-700 rounded"></div>
          <div className="h-8 bg-navy-200 dark:bg-navy-700 rounded w-1/3"></div>
          <div className="space-y-2">
            <div className="h-4 bg-navy-200 dark:bg-navy-700 rounded"></div>
            <div className="h-4 bg-navy-200 dark:bg-navy-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Error loading profile: {error.message}
        </p>
        <button onClick={() => navigate('/questions')} className="btn-primary">
          Back to Questions
        </button>
      </div>
    );
  }

  const { user, questions, answers, stats } = profileData;
  const isOwnProfile = currentUser && currentUser._id === user._id;

  const tabs = [
    {
      id: 'questions',
      label: 'Questions',
      count: questions.length,
      icon: FiMessageSquare,
    },
    { id: 'answers', label: 'Answers', count: answers.length, icon: FiCheck },
    {
      id: 'activity',
      label: 'Activity',
      count: stats.totalActivity,
      icon: FiTrendingUp,
    },
  ];

  const formatDate = date => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getReputationColor = reputation => {
    if (reputation >= 1000) return 'text-yellow-600 dark:text-yellow-400';
    if (reputation >= 500) return 'text-green-600 dark:text-green-400';
    if (reputation >= 100) return 'text-blue-600 dark:text-blue-400';
    return 'text-navy-600 dark:text-navy-400';
  };

  const getReputationBadge = reputation => {
    if (reputation >= 1000)
      return {
        text: 'Expert',
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      };
    if (reputation >= 500)
      return {
        text: 'Contributor',
        color:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      };
    if (reputation >= 100)
      return {
        text: 'Member',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      };
    return {
      text: 'New User',
      color: 'bg-navy-100 text-navy-800 dark:bg-navy-900 dark:text-navy-200',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/questions')}
        className="flex items-center text-navy-600 dark:text-navy-300 hover:text-navy-900 dark:hover:text-white mb-6 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4 mr-2" />
        Back to Questions
      </button>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
          {/* Avatar and basic info */}
          <div className="flex flex-col items-center lg:items-start mb-6 lg:mb-0">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mb-4">
              <FiUser className="w-16 h-16 text-white" />
            </div>

            <div className="text-center lg:text-left">
              <h1 className="text-2xl font-bold text-navy-900 dark:text-white mb-2">
                {user.username}
              </h1>
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getReputationBadge(user.reputation).color}`}
              >
                {getReputationBadge(user.reputation).text}
              </div>
            </div>
          </div>

          {/* Stats and details */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div
                  className={`text-3xl font-bold ${getReputationColor(user.reputation)}`}
                >
                  {user.reputation}
                </div>
                <div className="text-sm text-navy-600 dark:text-navy-400">
                  Reputation
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-navy-900 dark:text-white">
                  {questions.length}
                </div>
                <div className="text-sm text-navy-600 dark:text-navy-400">
                  Questions
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-navy-900 dark:text-white">
                  {answers.length}
                </div>
                <div className="text-sm text-navy-600 dark:text-navy-400">
                  Answers
                </div>
              </div>
            </div>

            {/* User details */}
            <div className="space-y-3">
              {user.email && (
                <div className="flex items-center text-navy-600 dark:text-navy-400">
                  <FiMail className="w-4 h-4 mr-2" />
                  <span>{user.email}</span>
                </div>
              )}

              <div className="flex items-center text-navy-600 dark:text-navy-400">
                <FiCalendar className="w-4 h-4 mr-2" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>

              {user.bio && (
                <div className="text-navy-700 dark:text-navy-300">
                  {user.bio}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {isOwnProfile && (
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => navigate('/settings')}
                  className="btn-outline"
                >
                  <FiSettings className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {stats.totalViews}
          </div>
          <div className="text-sm text-navy-600 dark:text-navy-400">
            Total Views
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.acceptedAnswers}
          </div>
          <div className="text-sm text-navy-600 dark:text-navy-400">
            Accepted Answers
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.totalVotes}
          </div>
          <div className="text-sm text-navy-600 dark:text-navy-400">
            Total Votes
          </div>
        </div>

        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.questionsThisMonth}
          </div>
          <div className="text-sm text-navy-600 dark:text-navy-400">
            This Month
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="border-b border-navy-200 dark:border-navy-700">
          <nav className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className="bg-navy-100 dark:bg-navy-700 text-navy-600 dark:text-navy-400 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </motion.div>

      {/* Tab content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {questions.length > 0 ? (
              questions.map(question => (
                <QuestionCard key={question._id} question={question} />
              ))
            ) : (
              <div className="text-center py-12">
                <FiMessageSquare className="w-16 h-16 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
                  No questions yet
                </h3>
                <p className="text-navy-600 dark:text-navy-400">
                  {isOwnProfile
                    ? "You haven't asked any questions yet. Start contributing to the community!"
                    : "This user hasn't asked any questions yet."}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/ask')}
                    className="btn-primary mt-4"
                  >
                    Ask Your First Question
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'answers' && (
          <div className="space-y-6">
            {answers.length > 0 ? (
              answers.map(answer => (
                <div key={answer._id} className="card p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex flex-col items-center space-y-2">
                      <button className="p-2 text-navy-400 hover:text-primary-600 dark:hover:text-primary-400">
                        <FiThumbsUp className="w-5 h-5" />
                      </button>
                      <span className="text-lg font-semibold text-navy-900 dark:text-white">
                        {answer.votes.upvotes.length -
                          answer.votes.downvotes.length}
                      </span>
                      <button className="p-2 text-navy-400 hover:text-red-600 dark:hover:text-red-400">
                        <FiThumbsUp className="w-5 h-5 transform rotate-180" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                          <a
                            href={`/questions/${answer.question._id}`}
                            className="hover:text-primary-600 dark:hover:text-primary-400"
                          >
                            {answer.question.title}
                          </a>
                        </h3>
                        {answer.isAccepted && (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <FiCheck className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">
                              Accepted
                            </span>
                          </div>
                        )}
                      </div>

                      <div
                        className="prose prose-navy dark:prose-invert max-w-none mb-4"
                        dangerouslySetInnerHTML={{
                          __html: answer.content.substring(0, 200) + '...',
                        }}
                      />

                      <div className="flex items-center justify-between text-sm text-navy-500 dark:text-navy-400">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <FiEye className="w-4 h-4" />
                            <span>{answer.question.viewCount} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <FiTag className="w-4 h-4" />
                            <span>{answer.question.tags.length} tags</span>
                          </div>
                        </div>
                        <span>{formatDate(answer.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FiCheck className="w-16 h-16 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
                  No answers yet
                </h3>
                <p className="text-navy-600 dark:text-navy-400">
                  {isOwnProfile
                    ? "You haven't answered any questions yet. Start helping others!"
                    : "This user hasn't answered any questions yet."}
                </p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/questions')}
                    className="btn-primary mt-4"
                  >
                    Browse Questions
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-4">
                {stats.recentActivity?.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-navy-50 dark:bg-navy-800 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      {activity.type === 'question' && (
                        <FiMessageSquare className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      )}
                      {activity.type === 'answer' && (
                        <FiCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                      {activity.type === 'vote' && (
                        <FiThumbsUp className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-navy-700 dark:text-navy-300">
                        {activity.description}
                      </p>
                      <p className="text-xs text-navy-500 dark:text-navy-400">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserProfilePage;
