import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiUser,
  FiMail,
  FiLock,
  FiBell,
  FiMoon,
  FiSun,
  FiEye,
  FiEyeOff,
  FiSave,
  FiX,
  FiEdit,
  FiCamera,
  FiTrash2,
  FiShield,
  FiKey,
  FiGlobe,
  FiSmartphone,
} from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: null,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    mentionNotifications: true,
    answerNotifications: true,
    voteNotifications: true,
  });

  // Fetch user data
  const { data: userData, isLoading } = useQuery(
    ['user-settings'],
    () => api.get('api/users/profile').then(res => res.data),
    {
      enabled: !!user,
      staleTime: 300000, // 5 minutes
    }
  );

  // Initialize form data when user data is loaded
  useEffect(() => {
    if (userData) {
      setProfileData({
        username: userData.username || '',
        email: userData.email || '',
        bio: userData.bio || '',
        avatar: null,
      });
      setPreferences({
        emailNotifications: userData.preferences?.emailNotifications ?? true,
        pushNotifications: userData.preferences?.pushNotifications ?? true,
        weeklyDigest: userData.preferences?.weeklyDigest ?? false,
        mentionNotifications:
          userData.preferences?.mentionNotifications ?? true,
        answerNotifications: userData.preferences?.answerNotifications ?? true,
        voteNotifications: userData.preferences?.voteNotifications ?? true,
      });
    }
  }, [userData]);

  // Mutations
  const updateProfileMutation = useMutation(
    data => api.put('api/users/profile', data),
    {
      onSuccess: data => {
        queryClient.invalidateQueries(['user-settings']);
        updateUser(data.user);
        toast.success('Profile updated successfully!');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to update profile'
        );
      },
    }
  );

  const changePasswordMutation = useMutation(
    data => api.put('api/users/change-password', data),
    {
      onSuccess: () => {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswordForm(false);
        toast.success('Password changed successfully!');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to change password'
        );
      },
    }
  );

  const updatePreferencesMutation = useMutation(
    data => api.put('api/users/preferences', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user-settings']);
        toast.success('Preferences updated successfully!');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to update preferences'
        );
      },
    }
  );

  const deleteAccountMutation = useMutation(
    () => api.delete('api/users/account'),
    {
      onSuccess: () => {
        toast.success('Account deleted successfully');
        // Redirect to logout
        window.location.href = '/logout';
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to delete account'
        );
      },
    }
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: theme === 'dark' ? FiMoon : FiSun,
    },
    { id: 'danger', label: 'Danger Zone', icon: FiTrash2 },
  ];

  const handleProfileSubmit = e => {
    e.preventDefault();
    if (!profileData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    const formData = new FormData();
    formData.append('username', profileData.username);
    formData.append('email', profileData.email);
    formData.append('bio', profileData.bio);
    if (profileData.avatar) {
      formData.append('avatar', profileData.avatar);
    }

    updateProfileMutation.mutate(formData);
  };

  const handlePasswordSubmit = e => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const handlePreferencesChange = (key, value) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updatePreferencesMutation.mutate(newPreferences);
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Are you absolutely sure? This action cannot be undone and will permanently delete your account and all associated data.'
      )
    ) {
      deleteAccountMutation.mutate();
    }
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error('Avatar file size must be less than 5MB');
        return;
      }
      setProfileData({ ...profileData, avatar: file });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-navy-200 dark:bg-navy-700 rounded w-1/4"></div>
          <div className="h-64 bg-navy-200 dark:bg-navy-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-navy-600 dark:text-navy-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-64 flex-shrink-0"
        >
          <nav className="space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-navy-600 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1"
        >
          {activeTab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-navy-900 dark:text-white mb-6">
                Profile Information
              </h2>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                      <FiUser className="w-10 h-10 text-white" />
                    </div>
                    <label className="absolute bottom-0 right-0 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                      <FiCamera className="w-3 h-3 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm text-navy-600 dark:text-navy-400">
                      Upload a new avatar image
                    </p>
                    <p className="text-xs text-navy-500 dark:text-navy-500">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={e =>
                      setProfileData({
                        ...profileData,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={e =>
                      setProfileData({ ...profileData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={e =>
                      setProfileData({ ...profileData, bio: e.target.value })
                    }
                    rows="4"
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                    className="btn-primary disabled:opacity-50"
                  >
                    <FiSave className="w-4 h-4 mr-2" />
                    {updateProfileMutation.isLoading
                      ? 'Saving...'
                      : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-navy-900 dark:text-white mb-6">
                Security Settings
              </h2>

              <div className="space-y-6">
                {/* Change Password */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-navy-900 dark:text-white">
                        Change Password
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        Update your password to keep your account secure
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="btn-outline"
                    >
                      <FiKey className="w-4 h-4 mr-2" />
                      Change Password
                    </button>
                  </div>

                  {showPasswordForm && (
                    <form
                      onSubmit={handlePasswordSubmit}
                      className="space-y-4 p-4 bg-navy-50 dark:bg-navy-800 rounded-lg"
                    >
                      <div>
                        <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={e =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={e =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={e =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                          required
                        />
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(false)}
                          className="btn-outline"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={changePasswordMutation.isLoading}
                          className="btn-primary disabled:opacity-50"
                        >
                          {changePasswordMutation.isLoading
                            ? 'Changing...'
                            : 'Change Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Two-Factor Authentication */}
                <div className="border-t border-navy-200 dark:border-navy-700 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-navy-900 dark:text-white">
                        Two-Factor Authentication
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="btn-outline">
                      <FiSmartphone className="w-4 h-4 mr-2" />
                      Enable 2FA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-navy-900 dark:text-white mb-6">
                Notification Preferences
              </h2>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-navy-900 dark:text-white">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        Receive notifications via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={e =>
                          handlePreferencesChange(
                            'emailNotifications',
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-navy-200 dark:bg-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-navy-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-navy-900 dark:text-white">
                        Push Notifications
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        Receive browser push notifications
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.pushNotifications}
                        onChange={e =>
                          handlePreferencesChange(
                            'pushNotifications',
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-navy-200 dark:bg-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-navy-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-navy-900 dark:text-white">
                        Weekly Digest
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        Receive a weekly summary of activity
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.weeklyDigest}
                        onChange={e =>
                          handlePreferencesChange(
                            'weeklyDigest',
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-navy-200 dark:bg-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-navy-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-navy-900 dark:text-white">
                        Mention Notifications
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        When someone mentions you
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.mentionNotifications}
                        onChange={e =>
                          handlePreferencesChange(
                            'mentionNotifications',
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-navy-200 dark:bg-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-navy-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-navy-900 dark:text-white">
                        Answer Notifications
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        When someone answers your question
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.answerNotifications}
                        onChange={e =>
                          handlePreferencesChange(
                            'answerNotifications',
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-navy-200 dark:bg-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-navy-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-navy-900 dark:text-white">
                        Vote Notifications
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        When someone votes on your content
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.voteNotifications}
                        onChange={e =>
                          handlePreferencesChange(
                            'voteNotifications',
                            e.target.checked
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-navy-200 dark:bg-navy-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-navy-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-navy-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-navy-900 dark:text-white mb-6">
                Appearance Settings
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-navy-900 dark:text-white">
                      Theme
                    </h3>
                    <p className="text-sm text-navy-600 dark:text-navy-400">
                      Choose your preferred theme
                    </p>
                  </div>
                  <button onClick={toggleTheme} className="btn-outline">
                    {theme === 'dark' ? (
                      <>
                        <FiSun className="w-4 h-4 mr-2" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <FiMoon className="w-4 h-4 mr-2" />
                        Dark Mode
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t border-navy-200 dark:border-navy-700 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-navy-900 dark:text-white">
                        Language
                      </h3>
                      <p className="text-sm text-navy-600 dark:text-navy-400">
                        Choose your preferred language
                      </p>
                    </div>
                    <select className="px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white">
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="card p-6 border-red-200 dark:border-red-800">
              <h2 className="text-xl font-semibold text-red-900 dark:text-red-100 mb-6">
                Danger Zone
              </h2>

              <div className="space-y-6">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                    Delete Account
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isLoading}
                    className="btn-danger disabled:opacity-50"
                  >
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    {deleteAccountMutation.isLoading
                      ? 'Deleting...'
                      : 'Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
