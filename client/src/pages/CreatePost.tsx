import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { Search, X } from 'lucide-react';
import { getTagClasses } from '../utils/tagColors';
import { getTagIcon } from '../utils/tagMeta';
import { useNoScroll } from '../hooks/useNoScroll';

const CreatePost: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    selectedTag: '',
    isAnonymous: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Disable scrolling on this page
  useNoScroll();

  // Available tags with distinct colors
  const AVAILABLE_TAGS = [
    { name: 'Politics', color: '#DC2626' },      // Red
    { name: 'Economics', color: '#059669' },     // Emerald
    { name: 'Technology', color: '#2563EB' },    // Blue
    { name: 'Science', color: '#7C3AED' },       // Violet
    { name: 'Environment', color: '#16A34A' },   // Green
    { name: 'Education', color: '#EA580C' },     // Orange
    { name: 'Religion', color: '#7C2D12' },      // Amber-800
    { name: 'Ethics', color: '#BE123C' },        // Rose
    { name: 'Law', color: '#1E40AF' },           // Blue-800
    { name: 'Media', color: '#9333EA' },         // Purple
    { name: 'Art', color: '#EC4899' },           // Pink
    { name: 'Music', color: '#8B5CF6' },         // Violet-400
    { name: 'Film', color: '#06B6D4' },          // Cyan
    { name: 'Sports', color: '#EF4444' },        // Red-500
    { name: 'Health', color: '#10B981' },        // Emerald-500
    { name: 'Food', color: '#F59E0B' },          // Amber-500
    { name: 'Travel', color: '#3B82F6' },        // Blue-500
    { name: 'Relationships', color: '#F97316' }, // Orange-500
    { name: 'Family', color: '#84CC16' },        // Lime-500
    { name: 'Friendship', color: '#06B6D4' },    // Cyan-500
    { name: 'Career', color: '#6366F1' },        // Indigo-500
    { name: 'Fashion', color: '#D946EF' },       // Fuchsia-500
    { name: 'Pets', color: '#14B8A6' },          // Teal-500
    { name: 'Gaming', color: '#8B5CF6' },        // Violet-500
    { name: 'Internet', color: '#0EA5E9' },      // Sky-500
    { name: 'History', color: '#A3A3A3' },       // Neutral-400
    { name: 'Philosophy', color: '#64748B' },    // Slate-500
    { name: 'Space', color: '#1E1B4B' },         // Indigo-900
    { name: 'Lifestyle', color: '#BE185D' }      // Pink-700
  ];

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (data: { title: string; body?: string; tags: string[]; isAnonymous?: boolean }) => apiService.createPost(data),
    onSuccess: (response: any) => {
      toast.success('Post created successfully!');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      navigate('/');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create post');
    }
  });

  // Filter tags based on search query
  const filteredTags = AVAILABLE_TAGS.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (formData.body.length > 500) {
      newErrors.body = 'Body must be less than 500 characters';
    }

    if (!formData.selectedTag) {
      newErrors.selectedTag = 'Please select a tag';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      title: formData.title.trim(),
      body: formData.body.trim() || '',
      tags: [formData.selectedTag],
      isAnonymous: formData.isAnonymous
    };

    createPostMutation.mutate(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };



  return (
    <div className="h-screen bg-dot-pattern overflow-hidden">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 h-full">
        <div className="post-surface h-full overflow-y-auto">

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Title */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="title" className="text-lg font-semibold text-gray-900">
                  What's your question?
                </label>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {formData.title.length}/100
                </span>
              </div>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-4 text-lg border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                  errors.title 
                    ? 'border-red-300 focus:border-red-500 bg-red-50' 
                    : 'border-gray-200 focus:border-sky-300 bg-white hover:border-gray-300'
                }`}
                placeholder="Should pineapple be allowed on pizza?"
                maxLength={100}
              />
              {/* Error text removed by request; visual red styling remains via input border */}
            </div>

            {/* Tag Selection + Anonymous inline */}
            <div className="space-y-3">
              <label htmlFor="selectedTag" className="text-lg font-semibold text-gray-900">
                Choose a tag
              </label>
              <div className="flex items-start gap-3">
                {/* Tag chooser */}
                <div className="relative flex-1" ref={tagDropdownRef}>
                  {formData.selectedTag ? (
                    <div className="relative">
                      <div 
                        className="w-full px-4 h-14 border-2 border-gray-200 rounded-xl bg-white flex items-center justify-between cursor-pointer"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, selectedTag: '' }));
                          setSearchQuery('');
                          setIsTagDropdownOpen(true);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {(() => { const Icon = getTagIcon(formData.selectedTag); return <Icon className="w-5 h-5" />; })()}
                          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getTagClasses(formData.selectedTag)}`}>{formData.selectedTag}</span>
                        </div>
                        <X className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setIsTagDropdownOpen(true)}
                          className={`w-full px-4 h-14 pl-12 text-lg border-2 rounded-xl focus:outline-none ${
                            errors.selectedTag 
                              ? 'border-red-300 focus:border-red-500 bg-red-50' 
                              : 'border-gray-200 focus:border-sky-300 bg-white'
                          }`}
                          placeholder="Search for a tag..."
                        />
                      </div>
                      {/* Dropdown - solid background */}
                      {isTagDropdownOpen && (
                        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-auto">
                          {filteredTags.length > 0 ? (
                            filteredTags.map((tag) => {
                              const Icon = getTagIcon(tag.name);
                              return (
                                <button
                                  key={tag.name}
                                  type="button"
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, selectedTag: tag.name }));
                                    setSearchQuery('');
                                    setIsTagDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl"
                                >
                                  <Icon className="w-5 h-5" />
                                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getTagClasses(tag.name)}`}>{tag.name}</span>
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-4 py-3 text-gray-500 text-base">No tags found</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Anonymous toggle */}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isAnonymous: !prev.isAnonymous }))}
                  className={`inline-flex items-center gap-2 px-4 h-14 rounded-xl border-2 ${
                    formData.isAnonymous ? 'bg-sky-50 border-sky-300 text-sky-800' : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="text-sm font-medium">Post anonymously</span>
                </button>
              </div>

              {/* Error text removed by request; rely on red outline only */}
            </div>

            {/* Body */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="body" className="text-lg font-semibold text-gray-900">
                  Add context <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {formData.body.length}/500
                </span>
              </div>
              <textarea
                id="body"
                name="body"
                rows={4}
                value={formData.body}
                onChange={handleChange}
                className={`w-full px-4 py-4 text-base border-2 rounded-xl transition-all duration-200 focus:outline-none resize-none ${
                  errors.body 
                    ? 'border-red-300 focus:border-red-500 bg-red-50' 
                    : 'border-gray-200 focus:border-sky-300 bg-white hover:border-gray-300'
                }`}
                placeholder="Provide more context or details about your question..."
                maxLength={500}
              />
              {errors.body && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="w-4 h-4 bg-red-500 rounded-full mr-2 flex-shrink-0"></span>
                  {errors.body}
                </p>
              )}
            </div>


            {/* Anonymous Option moved inline with tag chooser above */}

            {/* Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createPostMutation.isPending}
                className="px-8 py-3 rounded-xl font-semibold border-2 border-sky-300 bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPostMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <LoadingSpinner size="sm" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
