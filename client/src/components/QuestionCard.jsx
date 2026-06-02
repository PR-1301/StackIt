import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiMessageSquare,
  FiEye,
  FiThumbsUp,
  FiClock,
  FiCheckCircle,
  FiUser,
  FiTrash2,
  FiEdit,
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import api from '../utils/api';

const QuestionCard = ({ question }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    questionId => api.delete(`api/questions/${questionId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['questions']);
        toast.success('Question deleted successfully');
      },
      onError: error => {
        toast.error(
          error.response?.data?.message || 'Failed to delete question'
        );
      },
    }
  );

  const handleDelete = questionId => {
    if (
      window.confirm(
        'Are you sure you want to delete this question? This action cannot be undone.'
      )
    ) {
      deleteMutation.mutate(questionId);
    }
  };

  const getStatusColor = () => {
    if (question.acceptedAnswer) return 'text-green-600 dark:text-green-400';
    if (question.answerCount > 0) return 'text-blue-600 dark:text-blue-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getStatusText = () => {
    if (question.acceptedAnswer) return 'Accepted';
    if (question.answerCount > 0) return 'Answered';
    return 'Unanswered';
  };

  const getStatusIcon = () => {
    if (question.acceptedAnswer) return FiCheckCircle;
    if (question.answerCount > 0) return FiMessageSquare;
    return FiClock;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="card p-6 hover:shadow-lg transition-shadow">
      <div className="flex space-x-4">
        {/* Stats */}
        <div className="flex-shrink-0 flex flex-col items-center space-y-2 text-center">
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-navy-900 dark:text-white">
              {typeof question.voteCount === 'number'
                ? question.voteCount
                : question.votes?.upvotes?.length -
                    question.votes?.downvotes?.length || 0}
            </span>
            <span className="text-xs text-navy-500 dark:text-navy-400">
              votes
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-semibold text-navy-900 dark:text-white">
              {question.answerCount}
            </span>
            <span className="text-xs text-navy-500 dark:text-navy-400">
              answers
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-semibold text-navy-900 dark:text-white">
              {question.viewCount}
            </span>
            <span className="text-xs text-navy-500 dark:text-navy-400">
              views
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <Link
              to={`/questions/${question._id}`}
              className="text-lg font-semibold text-navy-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 line-clamp-2"
            >
              {question.title}
            </Link>
            <div
              className={`flex items-center space-x-1 ml-4 ${getStatusColor()}`}
            >
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>

          <p className="text-navy-600 dark:text-navy-300 mb-4 line-clamp-2">
            {question.content.replace(/<[^>]*>/g, '').substring(0, 200)}
            {question.content.length > 200 && '...'}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {question.tags.map(tag => (
              <Link
                key={tag}
                to={`/questions?tags=${tag}`}
                className="badge badge-primary text-xs hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-navy-500 dark:text-navy-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <FiUser className="w-4 h-4" />
                <Link
                  to={`/profile/${question.author.username}`}
                  className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  {question.author.username}
                </Link>
              </div>
              <div className="flex items-center space-x-1">
                <FiClock className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(question.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {question.updatedAt !== question.createdAt && (
                <div className="flex items-center space-x-1">
                  <span>
                    edited{' '}
                    {formatDistanceToNow(new Date(question.updatedAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 text-navy-500 dark:text-navy-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <FiThumbsUp className="w-4 h-4" />
                <span>Vote</span>
              </button>
              <Link
                to={`/questions/${question._id}`}
                className="flex items-center space-x-1 text-navy-500 dark:text-navy-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <FiMessageSquare className="w-4 h-4" />
                <span>Answer</span>
              </Link>

              {/* Edit/Delete buttons - only show for author or admin */}
              {user &&
                (user._id === question.author._id || user.role === 'admin') && (
                  <>
                    <Link
                      to={`/questions/${question._id}/edit`}
                      className="flex items-center space-x-1 text-navy-500 dark:text-navy-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <FiEdit className="w-4 h-4" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(question._id)}
                      disabled={deleteMutation.isLoading}
                      className="flex items-center space-x-1 text-navy-500 dark:text-navy-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>
                        {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                      </span>
                    </button>
                  </>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
