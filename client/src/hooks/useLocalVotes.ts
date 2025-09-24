import { useState, useCallback } from 'react';

export interface LocalVote {
  postId: string;
  vote: 'yes' | 'no';
  timestamp: number;
}

const LOCAL_VOTES_KEY = 'argueit_local_votes';

export const useLocalVotes = () => {
  // Initialize with synchronous localStorage read to avoid flash of unvoted state
  const [localVotes, setLocalVotes] = useState<Record<string, LocalVote>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_VOTES_KEY);
      if (stored) {
        const votes = JSON.parse(stored);
        console.log('Initialized local votes from storage:', votes);
        return votes;
      } else {
        console.log('No local votes found in storage during init');
        return {};
      }
    } catch (error) {
      console.error('Error loading local votes during init:', error);
      return {};
    }
  });

  // Save votes to localStorage whenever they change
  const saveToStorage = useCallback((votes: Record<string, LocalVote>) => {
    try {
      localStorage.setItem(LOCAL_VOTES_KEY, JSON.stringify(votes));
    } catch (error) {
      console.error('Error saving local votes:', error);
    }
  }, []);

  // Add or update a vote
  const addLocalVote = useCallback((postId: string, vote: 'yes' | 'no') => {
    const newVote: LocalVote = {
      postId,
      vote,
      timestamp: Date.now()
    };

    console.log('Adding local vote:', postId, vote);
    setLocalVotes(prev => {
      const updated = {
        ...prev,
        [postId]: newVote
      };
      saveToStorage(updated);
      console.log('Updated local votes:', updated);
      return updated;
    });
  }, [saveToStorage]);

  // Remove a vote
  const removeLocalVote = useCallback((postId: string) => {
    setLocalVotes(prev => {
      const updated = { ...prev };
      delete updated[postId];
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // Get a specific vote
  const getLocalVote = useCallback((postId: string): 'yes' | 'no' | null => {
    const vote = localVotes[postId]?.vote || null;
    console.log(`getLocalVote(${postId}):`, vote, 'from localVotes:', localVotes);
    return vote;
  }, [localVotes]);

  // Get all local votes as array
  const getAllLocalVotes = useCallback((): LocalVote[] => {
    return Object.values(localVotes);
  }, [localVotes]);

  // Clear all local votes (useful when user logs in)
  const clearLocalVotes = useCallback(() => {
    setLocalVotes({});
    try {
      localStorage.removeItem(LOCAL_VOTES_KEY);
    } catch (error) {
      console.error('Error clearing local votes:', error);
    }
  }, []);

  // Check if user has voted on a post
  const hasVoted = useCallback((postId: string): boolean => {
    return postId in localVotes;
  }, [localVotes]);

  return {
    localVotes,
    addLocalVote,
    removeLocalVote,
    getLocalVote,
    getAllLocalVotes,
    clearLocalVotes,
    hasVoted
  };
};
