import React, { useState, useEffect } from 'react';
import { Post } from '../services/api';
import { Clock, User, X, Check } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { getTagClasses } from '../utils/tagColors';
import { getTagIcon } from '../utils/tagMeta';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLocalVotes } from '../hooks/useLocalVotes';

interface PostCardProps {
  post: Post;
  showVoting?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  showVoting = true 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { getLocalVote, addLocalVote } = useLocalVotes();
  
  // Determine current vote status (server vote for logged in users, local vote for anonymous)
  const currentVote = user ? post.userVote : getLocalVote(post.id);
  const [hasVoted, setHasVoted] = useState(!!currentVote);
  const [localPost, setLocalPost] = useState({
    ...post,
    userVote: currentVote
  });
  const [animationState, setAnimationState] = useState<{
    isAnimating: boolean;
    direction: 'yes' | 'no' | null;
  }>({
    isAnimating: false,
    direction: null
  });

  // Update local post when vote status changes or component mounts
  useEffect(() => {
    // Prefer the optimistic/local vote if we've already voted to avoid 50/50 flashes
    const derivedVote = (hasVoted && localPost.userVote)
      ? localPost.userVote
      : (animationState.isAnimating
          ? localPost.userVote
          : (user ? post.userVote : getLocalVote(post.id)));

    setLocalPost(prev => {
      // During animation, do not let external props stomp local optimistic state
      if (animationState.isAnimating) {
        if (prev.userVote === derivedVote) return prev;
        return { ...prev, userVote: derivedVote };
      }

      // Merge-in server props but never decrease counts and always keep determined userVote
      const mergedYes = Math.max(prev.yesCount ?? 0, post.yesCount ?? 0);
      const mergedNo = Math.max(prev.noCount ?? 0, post.noCount ?? 0);

      if (
        prev.id === post.id &&
        prev.userVote === derivedVote &&
        prev.yesCount === mergedYes &&
        prev.noCount === mergedNo
      ) {
        return prev;
      }

      return {
        ...post,
        yesCount: mergedYes,
        noCount: mergedNo,
        userVote: derivedVote
      };
    });

    // Keep hasVoted sticky once true
    setHasVoted(prev => prev || !!derivedVote);
  }, [user, hasVoted, post.userVote, post.yesCount, post.noCount, post.id, getLocalVote, animationState.isAnimating, localPost.userVote]);

  // Stop animation after duration
  useEffect(() => {
    if (!animationState.isAnimating) return;

    const timer = setTimeout(() => {
      setAnimationState(prev => ({ ...prev, isAnimating: false }));
    }, 500); // 500ms animation duration

    return () => clearTimeout(timer);
  }, [animationState.isAnimating]);
  
  const yesCount = localPost.yesCount || 0;
  const noCount = localPost.noCount || 0;
  const totalVotes = yesCount + noCount;
  
  // Calculate percentages with directional animation support
  let yesPercentage = 0;
  let noPercentage = 0;
  
  // Determine if we should treat this as having votes (including optimistic updates)
  const effectiveTotalVotes = totalVotes > 0 || localPost.userVote ? Math.max(totalVotes, 1) : 0;
  
  if (hasVoted) {
    // Show voting results when user has voted
    if (totalVotes > 0) {
      // Use actual vote counts
      yesPercentage = Math.round((yesCount / totalVotes) * 100);
      noPercentage = 100 - yesPercentage;
    } else if (localPost.userVote) {
      // First vote scenario - use 100% for the voted option
      yesPercentage = localPost.userVote === 'yes' ? 100 : 0;
      noPercentage = localPost.userVote === 'no' ? 100 : 0;
    } else {
      // Fallback - shouldn't happen
      yesPercentage = 50;
      noPercentage = 50;
      console.log(`PostCard ${post.id}: FALLBACK 50/50 - this shouldn't happen!`);
    }
  } else {
    // No voting results shown when user hasn't voted - buttons will be displayed instead
    yesPercentage = 0;
    noPercentage = 0;
  }

  // Vote mutation with optimistic updates (for logged-in users)
  const voteMutation = useMutation({
    mutationFn: (vote: 'yes' | 'no') => apiService.voteOnPost(post.id, vote),
    onMutate: async (vote) => {
      // Start directional animation
      setAnimationState({
        isAnimating: true,
        direction: vote
      });
      
      // Optimistic update for instant feedback
      setHasVoted(true);
      setLocalPost(prev => ({
        ...prev,
        yesCount: vote === 'yes' ? (prev.yesCount ?? 0) + 1 : (prev.yesCount ?? 0),
        noCount: vote === 'no' ? (prev.noCount ?? 0) + 1 : (prev.noCount ?? 0),
        userVote: vote
      }));
    },
    onSuccess: (response) => {
      // Update with actual server response, but never decrease below optimistic state
      setLocalPost(prev => ({
        ...prev,
        yesCount: Math.max(prev.yesCount ?? 0, (response?.yesCount ?? prev.yesCount ?? 0)),
        noCount: Math.max(prev.noCount ?? 0, (response?.noCount ?? prev.noCount ?? 0)),
        userVote: response?.userVote ?? prev.userVote
      }));
      // Very targeted invalidation - only for this specific post's data
      // This ensures vote counts stay accurate without affecting other posts
      setTimeout(() => {
        queryClient.setQueryData(['posts'], (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              posts: page.posts.map((p: any) => 
                p.id === post.id 
                  ? { 
                      ...p, 
                      yesCount: Math.max(p.yesCount ?? 0, response?.yesCount ?? p.yesCount ?? 0),
                      noCount: Math.max(p.noCount ?? 0, response?.noCount ?? p.noCount ?? 0),
                      userVote: response?.userVote ?? p.userVote 
                    }
                  : p
              )
            }))
          };
        });
      }, 100);
      
    },
    onError: (error: any) => {
      // Revert optimistic update on error (decrement the optimistic increment)
      const originalVote = user ? post.userVote : getLocalVote(post.id);
      setHasVoted(!!originalVote);
      setLocalPost(prev => ({
        ...prev,
        yesCount: prev.userVote === 'yes' ? Math.max(0, (prev.yesCount ?? 0) - 1) : (prev.yesCount ?? 0),
        noCount: prev.userVote === 'no' ? Math.max(0, (prev.noCount ?? 0) - 1) : (prev.noCount ?? 0),
        userVote: originalVote
      }));
      console.error('Vote error:', error.message || 'Failed to vote');
    }
  });

  const handleVote = (vote: 'yes' | 'no') => {
    if (user) {
      // Logged-in user: vote on server
      voteMutation.mutate(vote);
    } else {
      // Anonymous user: store vote locally with animation
      // Start directional animation
      setAnimationState({
        isAnimating: true,
        direction: vote
      });
      
      addLocalVote(post.id, vote);
      setHasVoted(true);
      setLocalPost(prev => ({
        ...prev,
        yesCount: vote === 'yes' ? (prev.yesCount ?? 0) + 1 : (prev.yesCount ?? 0),
        noCount: vote === 'no' ? (prev.noCount ?? 0) + 1 : (prev.noCount ?? 0),
        userVote: vote
      }));
      // Vote recorded locally without notification
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full post-surface px-6 py-6">
      {/* Header modernized: name with date below, tag pill with icon */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            {localPost.isAnonymous || !localPost.authorAvatarURL ? (
              <User className="w-4 h-4 text-gray-500" />
            ) : (
              <img
                src={localPost.authorAvatarURL}
                alt={localPost.authorDisplayName || 'User'}
                className="w-4 h-4 rounded-full object-cover"
              />
            )}
            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {localPost.authorDisplayName || 'Anonymous'}
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" /> {formatTimeAgo(new Date(localPost.createdAt))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Delete button for author's own post */}
            {user?.uid === localPost.authorUid && (
              <button
                onClick={async () => {
                  const confirmed = window.confirm('Are you sure you want to delete this post? This action cannot be undone.');
                  if (!confirmed) return;
                  try {
                    await apiService.deletePost(localPost.id);
                    // Optimistically hide this post by setting a flag
                    setLocalPost(prev => ({ ...prev, isDeleted: true } as any));
                    // Let lists refresh
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                  } catch (e) {
                    console.error('Delete failed', e);
                  }
                }}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors"
                aria-label="Delete post"
                title="Delete post"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {localPost.tags && localPost.tags.length > 0 && (() => {
              const tag = localPost.tags[0];
              const Icon = getTagIcon(tag);
              return (
                <span className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm ${getTagClasses(tag)}`}>
                  <Icon className="w-4 h-4" />
                  {tag}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {localPost.title}
        </h3>
      </div>

      {/* Body */}
      {localPost.body && (
        <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">
          {localPost.body}
        </p>
      )}

      {/* Voting Section */}
      {showVoting && (
        <div className="mb-4">
          {!hasVoted ? (
            /* Initial Tick/X Buttons */
            <div className="flex space-x-4">
              <button
                onClick={() => handleVote('yes')}
                disabled={voteMutation.isPending}
                className="flex-1 h-12 px-6 surface-bg border-2 border-green-500 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Check className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleVote('no')}
                disabled={voteMutation.isPending}
                className="flex-1 h-12 px-6 surface-bg border-2 border-red-500 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          ) : (
            /* Results after voting - simplified without total votes */
            <div className="space-y-3">
              {/* Vote bar with percentages only */}
              <div className="relative">
                <div className="w-full rounded-lg h-12 overflow-hidden flex bg-gray-50">
                  {/* Yes section */}
                  <div 
                    className={`bg-green-50 flex items-center justify-center text-green-700 font-medium transition-all duration-500 ease-out rounded-l-lg ring-2 ring-green-500 ring-inset ${
                      localPost.userVote === 'yes' ? 'shadow-inner' : ''
                    }`}
                    style={{ 
                      width: `${yesPercentage}%`,
                      minWidth: yesPercentage > 0 ? '1px' : '0'
                    }}
                  >
                    {yesPercentage > 15 && (
                      <div className="flex items-center space-x-1">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{yesPercentage}% ({yesCount})</span>
                      </div>
                    )}
                  </div>
                  
                  {/* No section */}
                  <div 
                    className={`bg-red-50 flex items-center justify-center text-red-700 font-medium transition-all duration-500 ease-out rounded-r-lg ring-2 ring-red-500 ring-inset ${
                      localPost.userVote === 'no' ? 'shadow-inner' : ''
                    }`}
                    style={{ 
                      width: `${noPercentage}%`,
                      minWidth: noPercentage > 0 ? '1px' : '0'
                    }}
                  >
                    {noPercentage > 15 && (
                      <div className="flex items-center space-x-1">
                        <X className="w-4 h-4 text-red-600" />
                        <span className="text-sm">{noPercentage}% ({noCount})</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Labels for small percentages */}
                {yesPercentage <= 15 && yesPercentage > 0 && (
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-green-700 flex items-center space-x-1 transition-opacity duration-300 animate-in fade-in">
                    <Check className="w-3 h-3 text-green-600" />
                    <span>{yesPercentage}% ({yesCount})</span>
                  </div>
                )}
                {noPercentage <= 15 && noPercentage > 0 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-red-700 flex items-center space-x-1 transition-opacity duration-300 animate-in fade-in">
                    <X className="w-3 h-3 text-red-600" />
                    <span>{noPercentage}% ({noCount})</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default PostCard;
