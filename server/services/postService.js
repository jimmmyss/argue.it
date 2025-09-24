const { getFirestore } = require('../config/firebase');
const { FieldValue } = require('firebase-admin/firestore');

class PostService {
  constructor() {
    try {
      this.db = getFirestore();
    } catch (error) {
      console.warn('PostService: Firebase not available, running in demo mode');
      this.db = null;
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData, authorUid) {
    try {
      const now = new Date();
      
      // Validate tags are present and valid
      if (!postData.tags || !Array.isArray(postData.tags) || postData.tags.length === 0) {
        throw new Error('Tags are required for post creation');
      }
      
      // Get author display name and avatar (or use Anonymous if requested)
      let authorDisplayName = 'Anonymous';
      let authorAvatarURL = null;
      if (!postData.isAnonymous) {
        try {
          const userDoc = await this.db.collection('users').doc(authorUid).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            authorDisplayName = userData.displayName || 'Anonymous';
            authorAvatarURL = userData.avatarURL || null;
          }
        } catch (error) {
          console.warn('Could not fetch author display name:', error);
        }
      }
      
      const post = {
        ...postData,
        authorUid,
        authorDisplayName,
        authorAvatarURL,
        createdAt: now,
        updatedAt: now,
        voteCount: 0,
        yesCount: 0,
        noCount: 0,
        reportCount: 0,
        isDeleted: false
      };

      const docRef = await this.db.collection('posts').add(post);
      
      // Return the created post with ID
      return {
        id: docRef.id,
        ...post
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  }

  /**
   * Get posts with filtering and pagination
   */
  async getPosts(filters = {}, userUid = null) {
    try {
      const {
        mode = 'date',
        timeWindow = 'all',
        tags,
        limit = 20,
        pageToken,
        sortOrder = 'desc'
      } = filters;

      console.log('getPosts called with:', { mode, timeWindow, tags, limit, pageToken });

      if (!this.db) {
        console.log('Running in demo mode');
        // Return mock posts for demo mode with tag filtering
        const mockPosts = [
          {
            id: 'demo1',
            title: 'Should pineapple be allowed on pizza?',
            body: 'This is one of the most controversial food debates.',
            authorUid: 'demo-user',
            authorDisplayName: 'Demo User',
            tags: ['food', 'pizza', 'controversial'],
            createdAt: new Date(),
            updatedAt: new Date(),
            voteCount: 150,
            yesCount: 75,
            noCount: 75,
            reportCount: 0,
            isDeleted: false
          },
          {
            id: 'demo2',
            title: 'Is remote work better than office work?',
            body: 'The debate about workplace flexibility continues.',
            authorUid: 'demo-user-2',
            authorDisplayName: 'Jane Smith',
            tags: ['work', 'productivity', 'lifestyle'],
            createdAt: new Date(Date.now() - 86400000), // 1 day ago
            updatedAt: new Date(Date.now() - 86400000),
            voteCount: 200,
            yesCount: 120,
            noCount: 80,
            reportCount: 0,
            isDeleted: false
          }
        ];

        // Apply tag filtering to mock data
        let filteredPosts = mockPosts;
        if (tags && tags.length > 0) {
          console.log('Filtering by tags:', tags);
          filteredPosts = mockPosts.filter(post => 
            post.tags && tags.some(selectedTag => post.tags.includes(selectedTag))
          );
          console.log('Filtered posts:', filteredPosts.length);
        }

        return {
          posts: filteredPosts,
          hasMore: false,
          nextPageToken: null
        };
      }

      let query = this.db.collection('posts')
        .where('isDeleted', '==', false);

      // Time window filter
      const hasTimeFilter = timeWindow !== 'all';
      let cutoffDate = null;
      if (hasTimeFilter) {
        const timeMap = {
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000
        };
        
        cutoffDate = new Date(Date.now() - timeMap[timeWindow]);
        query = query.where('createdAt', '>=', cutoffDate);
      }

      // Sorting based on mode
      console.log('Applying sort mode:', mode);
      switch (mode) {
        case 'date':
          query = query.orderBy('createdAt', sortOrder);
          console.log('Applied date sorting');
          break;
        case 'attraction':
          // Sort by vote count (Hot sorting) - server-side
          query = query.orderBy('voteCount', 'desc').orderBy('createdAt', 'desc');
          console.log('Applied server-side hot sorting by voteCount');
          break;
        case 'controversy':
          // Sort by vote count first (like hot), then we'll do client-side controversy sorting
          query = query.orderBy('voteCount', 'desc').orderBy('createdAt', 'desc');
          console.log('Applied server-side sorting by voteCount for controversy (will sort client-side)');
          break;
        default:
          query = query.orderBy('createdAt', sortOrder);
          console.log('Applied default date sorting');
      }

      // When filtering by tags or using Controversial mode, we need to fetch more posts
      let fetchLimit = limit;
      if (tags && tags.length > 0) {
        fetchLimit = limit * 3; // Fetch 3x more when filtering by tags
      } else if (mode === 'controversy') {
        fetchLimit = Math.min(limit * 3, 100); // Fetch 3x more for Controversial to allow proper sorting, max 100
      }
      
      // Pagination
      if (pageToken) {
        const lastDoc = await this.db.collection('posts').doc(pageToken).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      query = query.limit(fetchLimit);

      const snapshot = await query.get();
      const posts = [];
      let lastValidDoc = null;

      for (const doc of snapshot.docs) {
        const postData = doc.data();
        
        // Skip posts without tags (mandatory requirement)
        if (!postData.tags || !Array.isArray(postData.tags) || postData.tags.length === 0) {
          continue; // Skip posts without valid tags
        }
        
        // Filter by tags if specified
        if (tags && tags.length > 0) {
          const postTags = postData.tags || [];
          const hasMatchingTag = tags.some(selectedTag => 
            postTags.includes(selectedTag)
          );
          if (!hasMatchingTag) {
            continue; // Skip this post
          }
        }

        posts.push({
          id: doc.id,
          ...postData,
          createdAt: postData.createdAt.toDate(),
          updatedAt: postData.updatedAt.toDate()
        });

        lastValidDoc = doc;

        // Stop when we have enough posts
        if (posts.length >= limit) {
          break;
        }
      }

      // Client-side sorting for Controversial mode only (Hot is server-side)
      if (mode === 'controversy') {
        // Sort by controversy score (client-side calculation)
        posts.sort((a, b) => {
          const aTotal = a.yesCount + a.noCount;
          const bTotal = b.yesCount + b.noCount;
          
          // Skip posts with no votes
          if (aTotal === 0 && bTotal === 0) return 0;
          if (aTotal === 0) return 1;
          if (bTotal === 0) return -1;
          
          const aCloseness = 1 - Math.abs(a.yesCount / aTotal - 0.5) * 2; // 0..1 closeness to 50/50
          const bCloseness = 1 - Math.abs(b.yesCount / bTotal - 0.5) * 2;
          const weight = (t) => Math.min(Math.log10(Math.max(t, 1)) / 2, 1);
          const aScore = aCloseness * weight(aTotal);
          const bScore = bCloseness * weight(bTotal);
          if (bScore !== aScore) return bScore - aScore;
          if (bTotal !== aTotal) return bTotal - aTotal;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });
        console.log('Applied client-side controversy sorting');
      }

      // Add user vote information if authenticated
      if (userUid) {
        for (const post of posts) {
          try {
            const voteId = `${post.id}_${userUid}`;
            const voteDoc = await this.db.collection('votes').doc(voteId).get();
            post.userVote = voteDoc.exists ? voteDoc.data().vote : null;
          } catch (error) {
            console.error(`Error getting user vote for post ${post.id}:`, error);
            post.userVote = null;
          }
        }
      }

      // Determine if there are more posts
      const hasMore = (tags && tags.length > 0) || mode === 'controversy'
        ? (snapshot.docs.length === fetchLimit && posts.length >= limit) // For tag filtering or controversy, check if we fetched max and got desired amount
        : snapshot.docs.length >= limit; // For normal queries, check if we got at least the limit

      return {
        posts,
        hasMore,
        nextPageToken: lastValidDoc ? lastValidDoc.id : (posts.length > 0 ? posts[posts.length - 1].id : null)
      };
    } catch (error) {
      console.error('Error getting posts:', error);
      throw new Error('Failed to get posts');
    }
  }

  /**
   * Get a single post by ID with optional user vote information
   */
  async getPost(postId, userUid = null) {
    try {
      const postDoc = await this.db.collection('posts').doc(postId).get();
      
      if (!postDoc.exists || postDoc.data().isDeleted) {
        return null;
      }

      const postData = postDoc.data();
      const post = {
        id: postDoc.id,
        ...postData,
        createdAt: postData.createdAt.toDate(),
        updatedAt: postData.updatedAt.toDate()
      };

      // Add user vote information if requested
      if (userUid) {
        try {
          const voteId = `${postId}_${userUid}`;
          const voteDoc = await this.db.collection('votes').doc(voteId).get();
          post.userVote = voteDoc.exists ? voteDoc.data().vote : null;
        } catch (error) {
          console.error(`Error getting user vote for post ${postId}:`, error);
          post.userVote = null;
        }
      }

      return post;
    } catch (error) {
      console.error('Error getting post:', error);
      throw new Error('Failed to get post');
    }
  }

  /**
   * Vote on a post
   */
  async voteOnPost(postId, userUid, vote) {
    try {
      const voteId = `${postId}_${userUid}`;
      
      return await this.db.runTransaction(async (transaction) => {
        // Get current post data
        const postRef = this.db.collection('posts').doc(postId);
        const postDoc = await transaction.get(postRef);
        
        if (!postDoc.exists || postDoc.data().isDeleted) {
          throw new Error('Post not found');
        }

        const postData = postDoc.data();
        
        // Get current vote
        const voteRef = this.db.collection('votes').doc(voteId);
        const voteDoc = await transaction.get(voteRef);
        
        let yesCountChange = 0;
        let noCountChange = 0;
        let voteCountChange = 0;

        if (voteDoc.exists) {
          // User is changing their vote
          const currentVote = voteDoc.data().vote;
          
          if (currentVote === vote) {
            // Same vote, no change needed
            return {
              success: true,
              message: 'Vote already recorded'
            };
          }
          
          // Remove old vote counts
          if (currentVote === 'yes') {
            yesCountChange -= 1;
          } else {
            noCountChange -= 1;
          }
          
          // Add new vote counts
          if (vote === 'yes') {
            yesCountChange += 1;
          } else {
            noCountChange += 1;
          }
          
          // Update vote record
          transaction.update(voteRef, {
            vote,
            updatedAt: new Date()
          });
        } else {
          // New vote
          if (vote === 'yes') {
            yesCountChange = 1;
          } else {
            noCountChange = 1;
          }
          voteCountChange = 1;
          
          // Create vote record
          transaction.set(voteRef, {
            postId,
            userUid,
            vote,
            createdAt: new Date()
          });
        }

        // Update post counts
        const newYesCount = Math.max(0, postData.yesCount + yesCountChange);
        const newNoCount = Math.max(0, postData.noCount + noCountChange);
        const newVoteCount = Math.max(0, postData.voteCount + voteCountChange);

        transaction.update(postRef, {
          yesCount: newYesCount,
          noCount: newNoCount,
          voteCount: newVoteCount,
          updatedAt: new Date()
        });

        return {
          success: true,
          yesCount: newYesCount,
          noCount: newNoCount,
          voteCount: newVoteCount,
          userVote: vote
        };
      });
    } catch (error) {
      console.error('Error voting on post:', error);
      throw new Error('Failed to vote on post');
    }
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId, userUid, isAdmin = false) {
    try {
      const postRef = this.db.collection('posts').doc(postId);
      const postDoc = await postRef.get();
      
      if (!postDoc.exists) {
        throw new Error('Post not found');
      }

      const postData = postDoc.data();
      
      // Check if user can delete this post
      if (!isAdmin && postData.authorUid !== userUid) {
        throw new Error('Unauthorized to delete this post');
      }

      await postRef.update({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userUid
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new Error('Failed to delete post');
    }
  }

  /**
   * Calculate controversy score (closer to 0.5 = more controversial)
   */
  calculateControversy(yesCount, noCount) {
    if (yesCount + noCount === 0) return 0;
    
    const total = yesCount + noCount;
    
    // Need minimum votes to be considered controversial
    if (total < 5) return 0;
    
    const yesRatio = yesCount / total;
    
    // Distance from 0.5 (perfect split) - closer to 0.5 means more controversial
    const controversyScore = 1 - Math.abs(yesRatio - 0.5) * 2;
    
    // Weight by total votes (more votes = more reliable controversy score)
    // Use logarithmic scale to prevent very high vote counts from dominating
    const voteWeight = Math.min(Math.log10(total) / 2, 1); // Log scale, cap at 1
    
    // Final score combines controversy ratio with vote volume
    return controversyScore * voteWeight * total;
  }

}

module.exports = new PostService();
