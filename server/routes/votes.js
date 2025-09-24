const express = require('express');
const { verifyToken, checkBanned } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const Joi = require('joi');
const postService = require('../services/postService');

const router = express.Router();

// Validation schema for syncing local votes
const syncVotesSchema = Joi.object({
  votes: Joi.array().items(
    Joi.object({
      postId: Joi.string().required(),
      vote: Joi.string().valid('yes', 'no').required(),
      timestamp: Joi.number().required()
    })
  ).required()
});

/**
 * POST /api/votes/sync
 * Sync local votes with server when user logs in
 */
router.post('/sync', 
  verifyToken, 
  checkBanned,
  validate(syncVotesSchema),
  async (req, res) => {
    try {
      const { uid } = req.user;
      const { votes } = req.body;
      
      const results = {
        synced: 0,
        skipped: 0,
        errors: 0
      };

      for (const localVote of votes) {
        try {
          // Check if user has already voted on this post
          const existingPost = await postService.getPost(localVote.postId, uid);
          
          if (!existingPost) {
            console.warn(`Post ${localVote.postId} not found during vote sync`);
            results.errors++;
            continue;
          }

          if (existingPost.userVote) {
            // User already voted on server, skip
            results.skipped++;
            continue;
          }

          // Sync the local vote to server
          await postService.voteOnPost(localVote.postId, uid, localVote.vote);
          results.synced++;

        } catch (error) {
          console.error(`Error syncing vote for post ${localVote.postId}:`, error);
          results.errors++;
        }
      }

      res.json({
        success: true,
        message: 'Votes synced successfully',
        results
      });

    } catch (error) {
      console.error('Sync votes error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to sync votes'
      });
    }
  }
);

/**
 * GET /api/votes/user
 * Get all posts the user has voted on
 */
router.get('/user',
  verifyToken,
  async (req, res) => {
    try {
      const { uid } = req.user;
      const { limit = 20, pageToken } = req.query;

      // Get user's votes from the votes collection
      let query = req.app.locals.db.collection('votes')
        .where('userUid', '==', uid)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit));

      if (pageToken) {
        const lastDoc = await req.app.locals.db.collection('votes').doc(pageToken).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const votesSnapshot = await query.get();
      const votedPosts = [];

      // Get post details for each vote
      for (const voteDoc of votesSnapshot.docs) {
        const voteData = voteDoc.data();
        try {
          const post = await postService.getPost(voteData.postId, uid);
          if (post && !post.isDeleted) {
            votedPosts.push({
              ...post,
              voteInfo: {
                vote: voteData.vote,
                votedAt: voteData.createdAt.toDate()
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching post ${voteData.postId}:`, error);
        }
      }

      res.json({
        success: true,
        posts: votedPosts,
        hasMore: votesSnapshot.docs.length === parseInt(limit),
        nextPageToken: votesSnapshot.docs.length > 0 ? votesSnapshot.docs[votesSnapshot.docs.length - 1].id : null
      });

    } catch (error) {
      console.error('Get user votes error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user votes'
      });
    }
  }
);

module.exports = router;
