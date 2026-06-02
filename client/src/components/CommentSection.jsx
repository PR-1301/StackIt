import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import {
  FiMessageSquare,
  FiUser,
  FiClock,
  FiEdit,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const CommentSection = ({ contentType, contentId, comments = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addCommentMutation = useMutation(
    text =>
      api.post('api/comments', {
        contentType,
        contentId,
        content: text,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['question', contentId]);
        setCommentText('');
        setShowForm(false);
        toast.success('Comment added successfully!');
      },
      onError: error => {
        toast.error(error.response?.data?.message || 'Failed to add comment');
      },
    }
  );

  const updateCommentMutation = useMutation(
    ({ commentId, content }) =>
      api.put(`api/comments/${commentId}`, { content }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['question', contentId]);
        setEditingComment(null);
        toast.success('Comment updated successfully!');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to update comment'
        );
      },
    }
  );

  const deleteCommentMutation = useMutation(
    commentId => api.delete(`api/comments/${commentId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['question', contentId]);
        toast.success('Comment deleted successfully!');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to delete comment'
        );
      },
    }
  );

  const handleSubmit = () => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    addCommentMutation.mutate(commentText);
  };

  const handleUpdate = commentId => {
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    updateCommentMutation.mutate({ commentId, content: commentText });
  };

  const handleDelete = commentId => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const startEditing = comment => {
    setEditingComment(comment._id);
    setCommentText(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setCommentText('');
  };

  return (
    <div className="mt-6">
      {/* Comment form */}
      {user && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center text-sm text-navy-500 dark:text-navy-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4"
        >
          <FiMessageSquare className="w-4 h-4 mr-1" />
          Add a comment
        </button>
      )}

      {showForm && (
        <div className="mb-4 p-4 bg-navy-50 dark:bg-navy-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
              Add a comment
            </span>
            <button
              onClick={() => setShowForm(false)}
              className="text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Write your comment..."
            className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white resize-none"
            rows="3"
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={addCommentMutation.isLoading}
              className="text-sm btn-primary px-3 py-1 disabled:opacity-50"
            >
              {addCommentMutation.isLoading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment._id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <FiUser className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {editingComment === comment._id ? (
                  <div className="bg-navy-50 dark:bg-navy-800 rounded-lg p-3">
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-navy-800 text-navy-900 dark:text-white resize-none"
                      rows="2"
                    />
                    <div className="flex justify-end space-x-2 mt-2">
                      <button
                        onClick={cancelEditing}
                        className="text-sm text-navy-500 dark:text-navy-400 hover:text-navy-700 dark:hover:text-navy-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(comment._id)}
                        disabled={updateCommentMutation.isLoading}
                        className="text-sm btn-primary px-3 py-1 disabled:opacity-50"
                      >
                        {updateCommentMutation.isLoading
                          ? 'Updating...'
                          : 'Update'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-navy-50 dark:bg-navy-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-navy-900 dark:text-white">
                          {comment.author.username}
                        </span>
                        <span className="text-xs text-navy-500 dark:text-navy-400">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Edit/Delete buttons */}
                      {user &&
                        (user._id === comment.author._id ||
                          user.role === 'admin') && (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => startEditing(comment)}
                              className="text-xs text-navy-500 hover:text-primary-600 dark:hover:text-primary-400"
                            >
                              <FiEdit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(comment._id)}
                              className="text-xs text-navy-500 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                    </div>
                    <p className="text-sm text-navy-700 dark:text-navy-300">
                      {comment.content}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
