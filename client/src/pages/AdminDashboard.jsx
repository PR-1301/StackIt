import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiUsers,
  FiMessageSquare,
  FiFlag,
  FiCheck,
  FiX,
  FiEye,
  FiTrash2,
  FiShield,
  FiTrendingUp,
  FiAlertTriangle,
  FiClock,
  FiUser,
  FiMail,
  FiCalendar,
  FiSettings,
  FiBarChart2,
  FiActivity,
} from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);

  // Fetch admin data
  const {
    data: adminData,
    isLoading,
    error,
  } = useQuery(
    ['admin-dashboard'],
    () => api.get('api/admin/dashboard').then(res => res.data),
    {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    }
  );

  // Mutations
  const approveContentMutation = useMutation(
    ({ contentType, contentId }) =>
      api.post(`api/admin/${contentType}/${contentId}/approve`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success('Content approved successfully!');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to approve content'
        );
      },
    }
  );

  const rejectContentMutation = useMutation(
    ({ contentType, contentId, reason }) =>
      api.post(`api/admin/${contentType}/${contentId}/reject`, { reason }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success('Content rejected successfully!');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to reject content'
        );
      },
    }
  );

  const banUserMutation = useMutation(
    ({ userId, reason, duration }) =>
      api.post(`api/admin/users/${userId}/ban`, { reason, duration }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success('User banned successfully!');
      },
      onError: error => {
        toast.error(error.response?.data?.message || 'Failed to ban user');
      },
    }
  );

  const deleteContentMutation = useMutation(
    ({ contentType, contentId }) =>
      api.delete(`api/admin/${contentType}/${contentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['admin-dashboard']);
        toast.success('Content deleted successfully!');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to delete content'
        );
      },
    }
  );

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <FiShield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-navy-600 dark:text-navy-400">
          You don't have permission to access the admin dashboard.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-navy-200 dark:bg-navy-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-navy-200 dark:bg-navy-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">
          Error loading admin data: {error.message}
        </p>
      </div>
    );
  }

  const {
    stats,
    pendingContent,
    reportedContent,
    recentUsers,
    recentActivity,
  } = adminData;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiBarChart2 },
    { id: 'moderation', label: 'Content Moderation', icon: FiShield },
    { id: 'users', label: 'User Management', icon: FiUsers },
    { id: 'reports', label: 'Reports', icon: FiFlag },
    { id: 'activity', label: 'Recent Activity', icon: FiActivity },
  ];

  const handleApprove = (contentType, contentId) => {
    approveContentMutation.mutate({ contentType, contentId });
  };

  const handleReject = (contentType, contentId, reason) => {
    rejectContentMutation.mutate({ contentType, contentId, reason });
  };

  const handleBanUser = (userId, reason, duration) => {
    banUserMutation.mutate({ userId, reason, duration });
  };

  const handleDeleteContent = (contentType, contentId) => {
    if (
      window.confirm(
        'Are you sure you want to delete this content? This action cannot be undone.'
      )
    ) {
      deleteContentMutation.mutate({ contentType, contentId });
    }
  };

  const formatDate = date => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-navy-600 dark:text-navy-400">
          Manage users, moderate content, and monitor platform activity
        </p>
      </div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FiUsers className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-navy-600 dark:text-navy-400">
                Total Users
              </p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">
                {stats.totalUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FiMessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-navy-600 dark:text-navy-400">
                Total Questions
              </p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">
                {stats.totalQuestions}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FiFlag className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-navy-600 dark:text-navy-400">
                Pending Review
              </p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">
                {pendingContent.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <FiAlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-navy-600 dark:text-navy-400">
                Reports
              </p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">
                {reportedContent.length}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
                </button>
              );
            })}
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Users */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
                Recent Users
              </h3>
              <div className="space-y-3">
                {recentUsers.map(user => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-3 bg-navy-50 dark:bg-navy-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium text-navy-900 dark:text-white">
                          {user.username}
                        </p>
                        <p className="text-sm text-navy-500 dark:text-navy-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-navy-900 dark:text-white">
                        {user.reputation}
                      </p>
                      <p className="text-xs text-navy-500 dark:text-navy-400">
                        reputation
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
                Recent Activity
              </h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-navy-50 dark:bg-navy-800 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <FiActivity className="w-4 h-4 text-primary-600 dark:text-primary-400" />
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

        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
              Pending Content Review
            </h3>
            {pendingContent.length > 0 ? (
              pendingContent.map(content => (
                <div key={content._id} className="card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs rounded-full">
                          {content.type}
                        </span>
                        <span className="text-sm text-navy-500 dark:text-navy-400">
                          by {content.author.username}
                        </span>
                        <span className="text-sm text-navy-500 dark:text-navy-400">
                          {formatDate(content.createdAt)}
                        </span>
                      </div>

                      {content.type === 'question' && (
                        <div>
                          <h4 className="font-semibold text-navy-900 dark:text-white mb-2">
                            {content.title}
                          </h4>
                          <div
                            className="prose prose-navy dark:prose-invert max-w-none mb-4"
                            dangerouslySetInnerHTML={{
                              __html: content.content.substring(0, 300) + '...',
                            }}
                          />
                        </div>
                      )}

                      {content.type === 'answer' && (
                        <div>
                          <h4 className="font-semibold text-navy-900 dark:text-white mb-2">
                            Answer to: {content.question.title}
                          </h4>
                          <div
                            className="prose prose-navy dark:prose-invert max-w-none mb-4"
                            dangerouslySetInnerHTML={{
                              __html: content.content.substring(0, 300) + '...',
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleApprove(content.type, content._id)}
                        disabled={approveContentMutation.isLoading}
                        className="btn-success btn-sm"
                      >
                        <FiCheck className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleReject(
                            content.type,
                            content._id,
                            'Inappropriate content'
                          )
                        }
                        disabled={rejectContentMutation.isLoading}
                        className="btn-danger btn-sm"
                      >
                        <FiX className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteContent(content.type, content._id)
                        }
                        className="btn-outline btn-sm"
                      >
                        <FiTrash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FiCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
                  No pending content
                </h3>
                <p className="text-navy-600 dark:text-navy-400">
                  All content has been reviewed and approved.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
              User Management
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-navy-200 dark:border-navy-700">
                    <th className="text-left py-3 px-4 font-medium text-navy-900 dark:text-white">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-navy-900 dark:text-white">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-navy-900 dark:text-white">
                      Reputation
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-navy-900 dark:text-white">
                      Joined
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-navy-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-navy-900 dark:text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map(user => (
                    <tr
                      key={user._id}
                      className="border-b border-navy-100 dark:border-navy-800"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                            <FiUser className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <span className="font-medium text-navy-900 dark:text-white">
                            {user.username}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-navy-600 dark:text-navy-400">
                        {user.email}
                      </td>
                      <td className="py-3 px-4 text-navy-900 dark:text-white">
                        {user.reputation}
                      </td>
                      <td className="py-3 px-4 text-navy-600 dark:text-navy-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.isBanned
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="btn-outline btn-sm"
                          >
                            <FiEye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          {!user.isBanned && (
                            <button
                              onClick={() =>
                                handleBanUser(
                                  user._id,
                                  'Violation of community guidelines',
                                  '7d'
                                )
                              }
                              className="btn-danger btn-sm"
                            >
                              <FiX className="w-4 h-4 mr-1" />
                              Ban
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
              Reported Content
            </h3>
            {reportedContent.length > 0 ? (
              reportedContent.map(report => (
                <div key={report._id} className="card p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full">
                          Reported
                        </span>
                        <span className="text-sm text-navy-500 dark:text-navy-400">
                          by {report.reporter.username}
                        </span>
                        <span className="text-sm text-navy-500 dark:text-navy-400">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>

                      <h4 className="font-semibold text-navy-900 dark:text-white mb-2">
                        Reason: {report.reason}
                      </h4>

                      <div className="bg-navy-50 dark:bg-navy-800 p-4 rounded-lg mb-4">
                        <h5 className="font-medium text-navy-900 dark:text-white mb-2">
                          Reported Content:
                        </h5>
                        <div
                          className="prose prose-navy dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html:
                              report.content.content.substring(0, 200) + '...',
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() =>
                          handleDeleteContent(
                            report.content.type,
                            report.content._id
                          )
                        }
                        className="btn-danger btn-sm"
                      >
                        <FiTrash2 className="w-4 h-4 mr-1" />
                        Delete Content
                      </button>
                      <button
                        onClick={() =>
                          handleBanUser(
                            report.content.author._id,
                            'Content violation',
                            '30d'
                          )
                        }
                        className="btn-outline btn-sm"
                      >
                        <FiX className="w-4 h-4 mr-1" />
                        Ban User
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FiFlag className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
                  No reported content
                </h3>
                <p className="text-navy-600 dark:text-navy-400">
                  All content is following community guidelines.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="card p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                      <FiActivity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-navy-900 dark:text-white">
                        {activity.description}
                      </p>
                      <p className="text-sm text-navy-500 dark:text-navy-400">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          activity.type === 'user'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : activity.type === 'content'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {activity.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
