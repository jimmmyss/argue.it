const express = require('express');
const { verifyToken, optionalAuth, checkBanned } = require('../middleware/auth');
const { validate, createPostSchema, voteSchema, postsQuerySchema, rateLimitCheck } = require('../middleware/validation');
const postService = require('../services/postService');
const categoryService = require('../services/categoryService');

const router = express.Router();

/**
 * GET /api/posts
 * Get posts with filtering and pagination
 */
router.get('/', optionalAuth, validate(postsQuerySchema, 'query'), async (req, res) => {
  try {
    const result = await postService.getPosts(req.query, req.user?.uid);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get posts'
    });
  }
});


/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', 
  verifyToken, 
  checkBanned, 
  rateLimitCheck(5, 60 * 60 * 1000), // 5 posts per hour
  validate(createPostSchema), 
  async (req, res) => {
    try {
      const { uid } = req.user;
      const { tags } = req.body;
      
      // Define valid tags
      const VALID_TAGS = [
        'Politics', 'Economics', 'Technology', 'Science', 'Environment', 
        'Education', 'Religion', 'Ethics', 'Law', 'Media', 'Art', 'Music', 
        'Film', 'Sports', 'Health', 'Food', 'Travel', 'Relationships', 
        'Family', 'Friendship', 'Career', 'Fashion', 'Pets', 'Gaming', 
        'Internet', 'History', 'Philosophy', 'Space', 'Lifestyle'
      ];
      
      // Validate tags
      if (!tags || !Array.isArray(tags) || tags.length !== 1) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Exactly one tag is required'
        });
      }
      
      if (!VALID_TAGS.includes(tags[0])) {
        return res.status(400).json({
          error: 'Bad Request',
          message: `Invalid tag. Must be one of: ${VALID_TAGS.join(', ')}`
        });
      }

      const post = await postService.createPost(req.body, uid);

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        post
      });
    } catch (error) {
      console.error('Create post error:', error);
      
      if (error.message === 'Invalid tag' || error.message === 'Tags are required for post creation') {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create post'
      });
    }
  }
);

/**
 * POST /api/posts/:id/vote
 * Vote on a post
 */
router.post('/:id/vote', 
  verifyToken, 
  checkBanned, 
  validate(voteSchema), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { uid } = req.user;
      const { vote } = req.body;
      
      const result = await postService.voteOnPost(id, uid, vote);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'Bad Request',
          message: result.message || 'Failed to vote'
        });
      }

      // Calculate percentages
      const total = result.yesCount + result.noCount;
      const yesPercentage = total > 0 ? Math.round((result.yesCount / total) * 100) : 0;
      const noPercentage = total > 0 ? Math.round((result.noCount / total) * 100) : 0;

      res.json({
        success: true,
        message: 'Vote recorded successfully',
        vote: {
          userVote: result.userVote,
          yesCount: result.yesCount,
          noCount: result.noCount,
          totalVotes: result.voteCount,
          yesPercentage,
          noPercentage
        }
      });
    } catch (error) {
      console.error('Vote error:', error);
      
      if (error.message === 'Post not found') {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to vote on post'
      });
    }
  }
);

/**
 * DELETE /api/posts/:id
 * Delete a post (author or admin only)
 */
router.delete('/:id', verifyToken, checkBanned, async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, role } = req.user;
    
    const isAdmin = role === 'admin';
    
    const result = await postService.deletePost(id, uid, isAdmin);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Failed to delete post'
      });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Delete post error:', error);
    
    if (error.message === 'Post not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error.message === 'Unauthorized to delete this post') {
      return res.status(403).json({
        error: 'Forbidden',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete post'
    });
  }
});

/**
 * GET /api/posts/:id/stats
 * Get detailed post statistics
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await postService.getPostStats(id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get post stats error:', error);
    
    if (error.message === 'Post not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get post statistics'
    });
  }
});

/**
 * GET /api/posts/categories
 * Get all categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get categories'
    });
  }
});

/**
 * GET /api/posts/categories/:id/stats
 * Get category statistics
 */
router.get('/categories/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    const stats = await categoryService.getCategoryStats(id);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    
    if (error.message === 'Category not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get category statistics'
    });
  }
});

module.exports = router;
