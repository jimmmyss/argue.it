import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiService, Post } from '../services/api';
import PostCard from '../components/PostCard';
import SortFilter from '../components/SortFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTagClasses } from '../utils/tagColors';
import { 
  Vote, 
  DollarSign, 
  Laptop, 
  Microscope, 
  TreePine, 
  GraduationCap, 
  Church, 
  Scale, 
  Gavel, 
  Radio, 
  Palette, 
  Music, 
  Film, 
  Trophy, 
  Heart, 
  Utensils, 
  Plane, 
  Users, 
  Home as HomeIcon, 
  UserCheck, 
  Briefcase, 
  Shirt, 
  Dog, 
  Gamepad2, 
  Globe, 
  BookOpen, 
  Brain, 
  Rocket, 
  Coffee 
} from 'lucide-react';

// Tag to icon mapping
const getTagIcon = (tag: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    'Politics': Vote,
    'Economics': DollarSign,
    'Technology': Laptop,
    'Science': Microscope,
    'Environment': TreePine,
    'Education': GraduationCap,
    'Religion': Church,
    'Ethics': Scale,
    'Law': Gavel,
    'Media': Radio,
    'Art': Palette,
    'Music': Music,
    'Film': Film,
    'Sports': Trophy,
    'Health': Heart,
    'Food': Utensils,
    'Travel': Plane,
    'Relationships': Users,
    'Family': HomeIcon,
    'Friendship': UserCheck,
    'Career': Briefcase,
    'Fashion': Shirt,
    'Pets': Dog,
    'Gaming': Gamepad2,
    'Internet': Globe,
    'History': BookOpen,
    'Philosophy': Brain,
    'Space': Rocket,
    'Lifestyle': Coffee
  };
  
  return iconMap[tag] || Vote; // Default to Vote icon if not found
};

const Home: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Filter states
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagParam = searchParams.get('tags');
    return tagParam ? tagParam.split(',') : [];
  });
  const [sortMode, setSortMode] = useState<'date' | 'attraction' | 'controversy'>(
    (searchParams.get('mode') as any) || 'date'
  );
  const [timeWindow, setTimeWindow] = useState<'24h' | '7d' | '30d' | 'all'>(
    (searchParams.get('timeWindow') as any) || 'all'
  );

  // Fetch posts with infinite scroll
  const { 
    data: postsData, 
    isLoading: postsLoading, 
    error: postsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchPosts 
  } = useInfiniteQuery({
    queryKey: ['posts', sortMode, timeWindow, selectedTags],
    queryFn: ({ pageParam }) => {
      console.log('Fetching posts with tags:', selectedTags, 'pageParam:', pageParam);
      return apiService.getPosts({
        mode: sortMode,
        timeWindow,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        limit: selectedTags.length > 0 ? 10 : 10, // Always fetch 10 posts per page
        pageToken: pageParam
      });
    },
    getNextPageParam: (lastPage) => {
      console.log('Next page check:', { hasMore: lastPage.hasMore, nextToken: lastPage.nextPageToken });
      return lastPage.hasMore ? lastPage.nextPageToken : undefined;
    },
    initialPageParam: undefined,
    // Ensure fresh data when tags change
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    // Enable background refetch to get fresh data when tags change
    staleTime: 0,
  });

  // Fetch all posts for tag counts (without filtering)
  const { data: allPostsData } = useInfiniteQuery({
    queryKey: ['allPosts', sortMode, timeWindow],
    queryFn: ({ pageParam }) => apiService.getPosts({
      mode: sortMode,
      timeWindow,
      limit: 50, // Get more posts for better tag distribution
      pageToken: pageParam
    }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextPageToken : undefined,
    initialPageParam: undefined,
  });

  // Flatten filtered posts for display
  const allPosts: Post[] = postsData?.pages.flatMap(page => page.posts) || [];
  
  // Flatten all posts for tag counts (unfiltered)
  const allPostsForTags: Post[] = allPostsData?.pages.flatMap(page => page.posts) || [];

  // Extract tags with counts from all posts (not just filtered ones)
  const tagCounts = allPostsForTags.reduce((acc, post) => {
    (post.tags || []).forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  // Sort tags by count (descending) then alphabetically
  const availableTagsWithCounts = Object.entries(tagCounts)
    .sort(([a, countA], [b, countB]) => {
      if (countB !== countA) return countB - countA; // Sort by count descending
      return a.localeCompare(b); // Then alphabetically
    });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
    if (sortMode !== 'date') params.set('mode', sortMode);
    if (timeWindow !== 'all') params.set('timeWindow', timeWindow);
    
    setSearchParams(params);
  }, [selectedTags, sortMode, timeWindow, setSearchParams]);

  // Reset query when tags change to ensure fresh loading
  useEffect(() => {
    console.log('Tags changed, resetting query:', selectedTags);
    queryClient.resetQueries({ queryKey: ['posts', sortMode, timeWindow, selectedTags] });
  }, [selectedTags, queryClient, sortMode, timeWindow]);
  
  // Posts are already filtered by server based on selected tags
  const posts = allPosts;

  // Handle infinite scroll
  const handleScroll = useCallback(() => {
    // More aggressive threshold when filtering by tags to ensure content fills up
    const threshold = selectedTags.length > 0 ? 300 : 100; // pixels from bottom
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.offsetHeight;
    
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
    
    // Debug logging (remove in production)
    if (distanceFromBottom <= threshold + 50) {
      console.log('Scroll Debug:', {
        distanceFromBottom,
        hasNextPage,
        isFetchingNextPage,
        selectedTags,
        threshold,
        shouldFetch: distanceFromBottom <= threshold && hasNextPage && !isFetchingNextPage
      });
    }
    
    if (distanceFromBottom <= threshold) {
      if (hasNextPage && !isFetchingNextPage) {
        console.log('Fetching next page...');
        fetchNextPage();
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, selectedTags]);

  // Add throttling to scroll handler
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const throttledHandleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      handleScroll();
    }, 100); // 100ms throttle
  }, [handleScroll]);

  useEffect(() => {
    window.addEventListener('scroll', throttledHandleScroll);
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [throttledHandleScroll]);
  



  return (
    <div className="min-h-screen transition-colors duration-200">
      {/* Left Sidebar - Tags (Fixed Position) */}
      <div className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] overflow-y-auto z-10">
        <div className="p-4">
          <div className="post-surface p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Tags</h3>

            <div className="space-y-3">
                  {/* Individual tags */}
                  {availableTagsWithCounts.map(([tag, count]) => {
                    const isSelected = selectedTags.includes(tag);
                    const IconComponent = getTagIcon(tag);
                    const toggleTag = () => {
                      console.log('Toggling tag:', tag, 'currently selected:', isSelected);
                      if (isSelected) {
                        setSelectedTags(prev => prev.filter(t => t !== tag));
                      } else {
                        setSelectedTags(prev => [...prev, tag]);
                      }
                    };
                    
                    return (
                      <button
                        key={tag}
                        onClick={toggleTag}
                        className={`w-full px-5 py-3 rounded-full text-base transition-colors flex items-center justify-center gap-2 ${
                          isSelected 
                            ? `${getTagClasses(tag, true)} font-medium ring-2 ring-offset-0 ring-current` 
                            : `${getTagClasses(tag)} hover:opacity-90`
                        }`}
                      >
                        <IconComponent className="w-5 h-5 flex-shrink-0" />
                        <span className="text-center">{tag} ({count})</span>
                      </button>
                    );
                  })}
                  
                  {availableTagsWithCounts.length === 0 && (
                    <p className="text-sm text-gray-500 italic px-3 py-2">
                      No tags yet
                    </p>
                  )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - dead center on the window */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-2xl px-4 py-8 mx-auto">

          {/* Filters */}
          <div>
            <SortFilter
              sortMode={sortMode}
              onSortModeChange={setSortMode}
              timeWindow={timeWindow}
              onTimeWindowChange={setTimeWindow}
            />
          </div>

          {/* Posts */}
          <div className="mt-6 space-y-4">
            {postsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : postsError ? (
              <div className="text-center py-8 text-red-600 dark:text-red-400">
                Error loading posts. Please try again.
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedTags.length > 0 ? 'No posts found with selected tags.' : 'No posts available.'}
                </p>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                {isFetchingNextPage && (
                  <div className="flex justify-center py-4">
                    <LoadingSpinner />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
