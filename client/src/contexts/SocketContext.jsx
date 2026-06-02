import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(import.meta.env.VITE_API_URL, {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      newSocket.on('notification', notification => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show toast for new notifications
        if (notification.type === 'answer') {
          toast.success(
            `New answer to your question: ${notification.questionTitle}`
          );
        } else if (notification.type === 'comment') {
          toast.success(`New comment on your ${notification.contentType}`);
        } else if (notification.type === 'mention') {
          toast.success(`You were mentioned in a ${notification.contentType}`);
        }
      });

      newSocket.on('answer', data => {
        // Handle real-time answer updates
        console.log('New answer received:', data);
      });

      newSocket.on('comment', data => {
        // Handle real-time comment updates
        console.log('New comment received:', data);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const markAsRead = notificationId => {
    setNotifications(prev =>
      prev.map(notif =>
        notif._id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const sendNotification = data => {
    if (socket) {
      socket.emit('send-notification', data);
    }
  };

  const value = {
    socket,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    sendNotification,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
