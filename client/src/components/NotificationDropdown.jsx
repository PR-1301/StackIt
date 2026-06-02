import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell,
  FiCheck,
  FiTrash2,
  FiMessageSquare,
  FiThumbsUp,
  FiThumbsDown,
  FiX,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notificationsData, isLoading } = useQuery(
    ['notifications'],
    () => api.get('api/notifications?limit=10').then(res => res.data),
    {
      refetchInterval: 10000, // Poll every 10 seconds
      enabled: !!user,
    }
  );

  // Fetch unread count
  const { data: unreadData } = useQuery(
    ['notifications', 'unread'],
    () => api.get('api/notifications/unread-count').then(res => res.data),
    {
      refetchInterval: 5000, // Poll every 5 seconds
      enabled: !!user,
    }
  );

  const unreadCount = unreadData?.unreadCount || 0;
  const notifications = notificationsData?.notifications || [];

  // Mark notification as read
  const markAsReadMutation = useMutation(
    notificationId => api.put(`api/notifications/${notificationId}/read`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notifications', 'unread']);
      },
    }
  );

  // Mark all as read
  const markAllAsReadMutation = useMutation(
    () => api.put('api/notifications/read-all'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notifications', 'unread']);
        toast.success('All notifications marked as read');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to mark all as read'
        );
      },
    }
  );

  // Delete notification
  const deleteNotificationMutation = useMutation(
    notificationId => api.delete(`api/notifications/${notificationId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['notifications']);
        queryClient.invalidateQueries(['notifications', 'unread']);
        toast.success('Notification deleted');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to delete notification'
        );
      },
    }
  );

  const handleNotificationClick = notification => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDeleteNotification = (e, notificationId) => {
    e.stopPropagation();
    deleteNotificationMutation.mutate(notificationId);
  };

  const getNotificationIcon = type => {
    switch (type) {
      case 'comment':
        return <FiMessageSquare className="w-4 h-4" />;
      case 'upvote':
        return <FiThumbsUp className="w-4 h-4 text-green-600" />;
      case 'downvote':
        return <FiThumbsDown className="w-4 h-4 text-red-600" />;
      case 'accepted':
        return <FiCheck className="w-4 h-4 text-green-600" />;
      default:
        return <FiBell className="w-4 h-4" />;
    }
  };

  const getNotificationLink = notification => {
    if (notification.questionId) {
      return `/questions/${notification.questionId}`;
    }
    return '/notifications';
  };

  const formatTimeAgo = date => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-navy-600 dark:text-navy-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-navy-800 rounded-lg shadow-lg border border-navy-200 dark:border-navy-700 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-navy-200 dark:border-navy-700">
              <h3 className="font-semibold text-navy-900 dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-navy-500 dark:text-navy-400">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-navy-500 dark:text-navy-400">
                  No notifications yet
                </div>
              ) : (
                notifications.map(notification => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border-b border-navy-100 dark:border-navy-700 cursor-pointer hover:bg-navy-50 dark:hover:bg-navy-700/50 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium text-navy-900 dark:text-white">
                            {notification.sender?.username || 'Unknown User'}
                          </p>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-navy-500 dark:text-navy-400">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            <button
                              onClick={e =>
                                handleDeleteNotification(e, notification._id)
                              }
                              className="text-navy-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-navy-600 dark:text-navy-300 mt-1">
                          {notification.content}
                        </p>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-4 border-t border-navy-200 dark:border-navy-700">
                <Link
                  to="/notifications"
                  className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
