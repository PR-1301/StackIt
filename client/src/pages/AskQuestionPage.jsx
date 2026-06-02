import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiTag, FiX, FiHelpCircle } from 'react-icons/fi';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../utils/api';

const AskQuestionPage = () => {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const createQuestionMutation = useMutation(
    questionData => api.post('api/questions', questionData),
    {
      onSuccess: data => {
        toast.success('Question posted successfully!');
        queryClient.invalidateQueries(['questions']);
        navigate(`/questions/${data.data.question._id}`);
      },
      onError: error => {
        toast.error(error.response?.data?.message || 'Failed to post question');
      },
    }
  );

  const handleTagInputChange = e => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = tagToRemove => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = async data => {
    if (tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }

    if (content.trim().length < 20) {
      toast.error('Question content must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await createQuestionMutation.mutateAsync({
        title: data.title,
        content: content,
        tags: tags,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['link', 'image', 'code-block'],
      ['clean'],
    ],
  };

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'align',
    'link',
    'image',
    'code-block',
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900 dark:text-white mb-2">
            Ask a Question
          </h1>
          <p className="text-navy-600 dark:text-navy-300">
            Share your knowledge and help others learn
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2"
            >
              Title *
            </label>
            <input
              id="title"
              type="text"
              {...register('title', {
                required: 'Title is required',
                minLength: {
                  value: 10,
                  message: 'Title must be at least 10 characters',
                },
                maxLength: {
                  value: 150,
                  message: 'Title must be less than 150 characters',
                },
              })}
              className="input-field"
              placeholder="What's your question? Be specific."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.title.message}
              </p>
            )}
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
              Imagine you're asking another person
            </p>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Details *
            </label>
            <div className="border border-navy-300 dark:border-navy-600 rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Provide all the information someone would need to answer your question..."
                className="bg-white dark:bg-navy-800"
                style={{ minHeight: '200px' }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-navy-500 dark:text-navy-400">
              <span>Minimum 20 characters</span>
              <span>{content.replace(/<[^>]*>/g, '').length} characters</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
              Tags *
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tags (press Enter or comma to add)"
                  className="input-field flex-1"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 5}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>

              {/* Selected Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <div
                      key={tag}
                      className="badge badge-primary flex items-center space-x-1"
                    >
                      <FiTag className="w-3 h-3" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-start space-x-2 text-sm text-navy-500 dark:text-navy-400">
                <FiHelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>
                    Add up to 5 tags to describe what your question is about.
                  </p>
                  <p className="mt-1">
                    Popular tags: javascript, react, nodejs, python, css, html
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Writing a good question
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Be specific and provide context</li>
              <li>• Include code examples if relevant</li>
              <li>• Explain what you've tried so far</li>
              <li>• Use clear, descriptive language</li>
              <li>• Check for similar questions before posting</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-6 border-t border-navy-200 dark:border-navy-700">
            <button
              type="button"
              onClick={() => navigate('/questions')}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting || tags.length === 0 || content.trim().length < 20
              }
              className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Posting...
                </div>
              ) : (
                'Post Question'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AskQuestionPage;
