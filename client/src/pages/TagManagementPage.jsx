import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiTag,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiTrendingUp,
  FiMessageSquare,
  FiUsers,
  FiEye,
  FiX,
  FiCheck,
} from 'react-icons/fi';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const TagManagementPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  });

  // Fetch tags data
  const {
    data: tagsData,
    isLoading,
    error,
  } = useQuery(
    ['tags-management'],
    () => api.get('api/admin/tags').then(res => res.data),
    {
      staleTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Mutations
  const createTagMutation = useMutation(
    tagData => api.post('api/admin/tags', tagData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tags-management']);
        setFormData({ name: '', description: '', color: '#3B82F6' });
        setShowCreateForm(false);
        toast.success('Tag created successfully!');
      },
      onError: error => {
        toast.error(error.response?.data?.message || 'Failed to create tag');
      },
    }
  );

  const updateTagMutation = useMutation(
    ({ tagId, tagData }) => api.put(`api/admin/tags/${tagId}`, tagData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tags-management']);
        setEditingTag(null);
        setFormData({ name: '', description: '', color: '#3B82F6' });
        toast.success('Tag updated successfully!');
      },
      onError: error => {
        toast.error(error.response?.data?.message || 'Failed to update tag');
      },
    }
  );

  const deleteTagMutation = useMutation(
    tagId => api.delete(`api/admin/tags/${tagId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tags-management']);
        toast.success('Tag deleted successfully!');
      },
      onError: error => {
        toast.error(error.response?.data?.message || 'Failed to delete tag');
      },
    }
  );

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <FiTag className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-navy-900 dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-navy-600 dark:text-navy-400">
          You don't have permission to access tag management.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-navy-200 dark:bg-navy-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-navy-200 dark:bg-navy-700 rounded"
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
          Error loading tags: {error.message}
        </p>
      </div>
    );
  }

  const { tags, stats } = tagsData;

  const filteredTags = tags.filter(
    tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tag.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = e => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Tag name is required');
      return;
    }

    if (editingTag) {
      updateTagMutation.mutate({ tagId: editingTag._id, tagData: formData });
    } else {
      createTagMutation.mutate(formData);
    }
  };

  const handleEdit = tag => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description,
      color: tag.color,
    });
    setShowCreateForm(true);
  };

  const handleDelete = tagId => {
    if (
      window.confirm(
        'Are you sure you want to delete this tag? This action cannot be undone.'
      )
    ) {
      deleteTagMutation.mutate(tagId);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingTag(null);
    setFormData({ name: '', description: '', color: '#3B82F6' });
  };

  const colorOptions = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#84CC16',
    '#F97316',
    '#EC4899',
    '#6B7280',
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">
          Tag Management
        </h1>
        <p className="text-navy-600 dark:text-navy-400">
          Create, edit, and manage tags for organizing questions
        </p>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FiTag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-navy-600 dark:text-navy-400">
                Total Tags
              </p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">
                {stats.totalTags}
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
                Tagged Questions
              </p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">
                {stats.taggedQuestions}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-navy-600 dark:text-navy-400">
                Most Popular
              </p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">
                {stats.mostPopularTag}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FiUsers className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-navy-600 dark:text-navy-400">
                Active Tags
              </p>
              <p className="text-2xl font-bold text-navy-900 dark:text-white">
                {stats.activeTags}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search and Create */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6"
      >
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
          />
        </div>

        <button onClick={() => setShowCreateForm(true)} className="btn-primary">
          <FiPlus className="w-4 h-4 mr-2" />
          Create Tag
        </button>
      </motion.div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-4">
            {editingTag ? 'Edit Tag' : 'Create New Tag'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Tag Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter tag name..."
                className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Enter tag description..."
                rows="3"
                className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={e =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-12 h-10 border border-navy-300 dark:border-navy-600 rounded-lg cursor-pointer"
                />
                <div className="flex space-x-2">
                  {colorOptions.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className="w-8 h-8 rounded-full border-2 border-navy-300 dark:border-navy-600 hover:border-navy-400 dark:hover:border-navy-500 transition-colors"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  createTagMutation.isLoading || updateTagMutation.isLoading
                }
                className="btn-primary disabled:opacity-50"
              >
                {createTagMutation.isLoading || updateTagMutation.isLoading
                  ? 'Saving...'
                  : editingTag
                    ? 'Update Tag'
                    : 'Create Tag'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Tags Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredTags.map((tag, index) => (
          <motion.div
            key={tag._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <h3 className="text-lg font-semibold text-navy-900 dark:text-white">
                  {tag.name}
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(tag)}
                  className="p-1 text-navy-400 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(tag._id)}
                  className="p-1 text-navy-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {tag.description && (
              <p className="text-navy-600 dark:text-navy-400 mb-4">
                {tag.description}
              </p>
            )}

            <div className="flex items-center justify-between text-sm text-navy-500 dark:text-navy-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <FiMessageSquare className="w-4 h-4" />
                  <span>{tag.questionCount} questions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiEye className="w-4 h-4" />
                  <span>{tag.viewCount} views</span>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <FiTrendingUp className="w-4 h-4" />
                <span>{tag.trendingScore}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-navy-200 dark:border-navy-700">
              <div className="flex items-center justify-between text-xs text-navy-500 dark:text-navy-400">
                <span>
                  Created {new Date(tag.createdAt).toLocaleDateString()}
                </span>
                <span
                  className={`px-2 py-1 rounded-full ${
                    tag.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {tag.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredTags.length === 0 && (
        <div className="text-center py-12">
          <FiTag className="w-16 h-16 text-navy-300 dark:text-navy-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-navy-900 dark:text-white mb-2">
            {searchTerm ? 'No tags found' : 'No tags yet'}
          </h3>
          <p className="text-navy-600 dark:text-navy-400">
            {searchTerm
              ? 'Try adjusting your search terms'
              : 'Create your first tag to get started'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TagManagementPage;
