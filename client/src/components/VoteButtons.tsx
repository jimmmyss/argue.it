import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface VoteButtonsProps {
  postId: string;
  userVote?: 'yes' | 'no' | null;
  yesCount: number;
  noCount: number;
  size?: 'sm' | 'md' | 'lg';
  onVoteChange?: (newVote: 'yes' | 'no', yesCount: number, noCount: number) => void;
}

const VoteButtons: React.FC<VoteButtonsProps> = ({
  postId,
  userVote,
  yesCount,
  noCount,
  size = 'md',
  onVoteChange
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isVoting, setIsVoting] = useState(false);

  const voteMutation = useMutation({
    mutationFn: (vote: 'yes' | 'no') => apiService.voteOnPost(postId, vote),
    onSuccess: (data: any) => {
      // Update local state if callback provided
      if (onVoteChange) {
        onVoteChange(data.vote.userVote, data.vote.yesCount, data.vote.noCount);
      }
      
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      
      toast.success('Vote recorded!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to vote');
    },
    onSettled: () => {
      setIsVoting(false);
    }
  });

  const handleVote = async (vote: 'yes' | 'no') => {
    if (!user) {
      toast.error('Please log in to vote');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    voteMutation.mutate(vote);
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const totalVotes = yesCount + noCount;
  const yesPercentage = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;
  const noPercentage = totalVotes > 0 ? Math.round((noCount / totalVotes) * 100) : 0;

  return (
    <div className="flex items-center space-x-2">
      {/* Yes Button */}
      <button
        onClick={() => handleVote('yes')}
        disabled={isVoting}
        className={clsx(
          'vote-button-yes',
          sizeClasses[size],
          userVote === 'yes' && 'active',
          isVoting && 'opacity-50 cursor-not-allowed'
        )}
        title={`Vote Yes (${yesCount} votes, ${yesPercentage}%)`}
      >
        <div className="flex items-center space-x-1">
          <ThumbsUp className={iconSizes[size]} />
          <span>Yes</span>
          <span className="font-semibold">{yesCount}</span>
        </div>
      </button>

      {/* No Button */}
      <button
        onClick={() => handleVote('no')}
        disabled={isVoting}
        className={clsx(
          'vote-button-no',
          sizeClasses[size],
          userVote === 'no' && 'active',
          isVoting && 'opacity-50 cursor-not-allowed'
        )}
        title={`Vote No (${noCount} votes, ${noPercentage}%)`}
      >
        <div className="flex items-center space-x-1">
          <ThumbsDown className={iconSizes[size]} />
          <span>No</span>
          <span className="font-semibold">{noCount}</span>
        </div>
      </button>

      {/* Vote indicator for mobile */}
      {size === 'sm' && totalVotes > 0 && (
        <div className="text-xs text-gray-500 ml-2">
          {yesPercentage}% / {noPercentage}%
        </div>
      )}
    </div>
  );
};

export default VoteButtons;
