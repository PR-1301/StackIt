import { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { FiTag, FiX } from 'react-icons/fi';
import api from '../utils/api';

const TagFilter = ({ selectedTags, onTagChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: tagsData, isLoading } = useQuery(
    ['tags', searchTerm],
    () => fetchTags(),
    {
      staleTime: 300000, // 5 minutes
    }
  );

  const fetchTags = async () => {
    const params = new URLSearchParams({
      search: searchTerm,
      limit: 20,
    });
    const response = await api.get(`api/tags?${params}`);
    return response.data;
  };

  const handleTagToggle = tag => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    onTagChange(newTags);
  };

  const removeTag = tagToRemove => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagChange(newTags);
  };

  const clearAllTags = () => {
    onTagChange([]);
  };

  return (
    <div className="mb-6">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-navy-700 dark:text-navy-300">
            Filtered by:
          </span>
          {selectedTags.map(tag => (
            <div
              key={tag}
              className="badge badge-primary flex items-center space-x-1"
            >
              <span>{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-600 dark:hover:text-red-400"
              >
                <FiX className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={clearAllTags}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Tag Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-4 py-2 border border-navy-300 dark:border-navy-600 rounded-lg bg-white dark:bg-navy-800 text-navy-700 dark:text-navy-300 hover:bg-navy-50 dark:hover:bg-navy-700 transition-colors"
        >
          <FiTag className="w-4 h-4" />
          <span>Filter by tags</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-lg shadow-lg z-10 max-h-64 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-navy-200 dark:border-navy-700">
              <input
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-navy-300 dark:border-navy-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
              />
            </div>

            {/* Tags List */}
            <div className="max-h-48 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-navy-500 dark:text-navy-400">
                  Loading tags...
                </div>
              ) : tagsData?.tags?.length > 0 ? (
                <div className="p-2">
                  {tagsData.tags.map(tag => (
                    <button
                      key={tag.name}
                      onClick={() => handleTagToggle(tag.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedTags.includes(tag.name)
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                          : 'hover:bg-navy-100 dark:hover:bg-navy-700 text-navy-700 dark:text-navy-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{tag.name}</span>
                        <span className="text-xs text-navy-500 dark:text-navy-400">
                          ({tag.questionCount})
                        </span>
                      </div>
                      {selectedTags.includes(tag.name) && (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-navy-500 dark:text-navy-400">
                  No tags found
                </div>
              )}
            </div>

            {/* Popular Tags */}
            {!searchTerm && (
              <div className="p-3 border-t border-navy-200 dark:border-navy-700">
                <h4 className="text-sm font-medium text-navy-700 dark:text-navy-300 mb-2">
                  Popular Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {[
                    'javascript',
                    'react',
                    'nodejs',
                    'python',
                    'css',
                    'html',
                  ].map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
                          : 'bg-navy-100 text-navy-700 dark:bg-navy-700 dark:text-navy-300 hover:bg-navy-200 dark:hover:bg-navy-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TagFilter;
