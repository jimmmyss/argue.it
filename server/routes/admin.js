const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { validate, banUserSchema, deletePostSchema } = require('../middleware/validation');
const userService = require('../services/userService');
const postService = require('../services/postService');
const categoryService = require('../services/categoryService');
const { getFirestore } = require('../config/firebase');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get admin dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const db = getFirestore();
    
    // Get total counts
    const [usersSnapshot, postsSnapshot, votesSnapshot, reportsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('posts').where('isDeleted', '==', false).get(),
      db.collection('votes').get(),
      db.collection('reports').where('status', '==', 'pending').get()
    ]);

    // Get recent activity (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [recentUsersSnapshot, recentPostsSnapshot, recentVotesSnapshot] = await Promise.all([
      db.collection('users').where('createdAt', '>=', weekAgo).get(),
      db.collection('posts').where('createdAt', '>=', weekAgo).where('isDeleted', '==', false).get(),
      db.collection('votes').where('createdAt', '>=', weekAgo).get()
    ]);

    // Get banned users count
    const bannedUsersSnapshot = await db.collection('users')
      .where('isBanned', '==', true)
      .get();

    // Get categories with post counts
    const categories = await categoryService.getAllCategories();
    
    const stats = {
      totals: {
        users: usersSnapshot.size,
        posts: postsSnapshot.size,
        votes: votesSnapshot.size,
        pendingReports: reportsSnapshot.size,
        bannedUsers: bannedUsersSnapshot.size,
        categories: categories.length
      },
      recent: {
        newUsers: recentUsersSnapshot.size,
        newPosts: recentPostsSnapshot.size,
        newVotes: recentVotesSnapshot.size
      },
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        postCount: cat.postCount || 0
      }))
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get admin statistics'
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users with pagination
 */
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, pageToken } = req.query;
    
    const result = await userService.getAllUsers(parseInt(limit), pageToken);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get users'
    });
  }
});

/**
 * GET /api/admin/users/:uid
 * Get user details
 */
router.get('/users/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    
    const user = await userService.getUserByUid(uid);
    
    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found'
      });
    }

    const stats = await userService.getUserStats(uid);

    res.json({
      success: true,
      user: {
        ...user,
        ...stats
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user details'
    });
  }
});

/**
 * POST /api/admin/users/:uid/ban
 * Ban a user
 */
router.post('/users/:uid/ban', validate(banUserSchema), async (req, res) => {
  try {
    const { uid } = req.params;
    const { reason } = req.body;
    const adminUid = req.user.uid;
    
    if (uid === adminUid) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot ban yourself'
      });
    }

    await userService.banUser(uid, reason, adminUid);

    res.json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    console.error('Ban user error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to ban user'
    });
  }
});

/**
 * POST /api/admin/users/:uid/unban
 * Unban a user
 */
router.post('/users/:uid/unban', async (req, res) => {
  try {
    const { uid } = req.params;
    const adminUid = req.user.uid;
    
    await userService.unbanUser(uid, adminUid);

    res.json({
      success: true,
      message: 'User unbanned successfully'
    });
  } catch (error) {
    console.error('Unban user error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to unban user'
    });
  }
});

/**
 * PUT /api/admin/users/:uid/role
 * Update user role
 */
router.put('/users/:uid/role', async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;
    const adminUid = req.user.uid;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid role. Must be "user" or "admin"'
      });
    }

    if (uid === adminUid && role === 'user') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot demote yourself from admin'
      });
    }

    await userService.updateUserRole(uid, role, adminUid);

    res.json({
      success: true,
      message: `User role updated to ${role}`
    });
  } catch (error) {
    console.error('Update user role error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update user role'
    });
  }
});

/**
 * DELETE /api/admin/posts/:id
 * Delete a post (admin override)
 */
router.delete('/posts/:id', validate(deletePostSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const adminUid = req.user.uid;
    
    await postService.deletePost(id, adminUid, true);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete post error:', error);
    
    if (error.message === 'Post not found') {
      return res.status(404).json({
        error: 'Not Found',
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
 * GET /api/admin/reports
 * Get all reports
 */
router.get('/reports', async (req, res) => {
  try {
    const { status = 'pending', limit = 50, pageToken } = req.query;
    const db = getFirestore();
    
    let query = db.collection('reports')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));

    if (pageToken) {
      const lastDoc = await db.collection('reports').doc(pageToken).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const reports = [];

    for (const doc of snapshot.docs) {
      const reportData = doc.data();
      reports.push({
        id: doc.id,
        ...reportData,
        createdAt: reportData.createdAt.toDate()
      });
    }

    res.json({
      success: true,
      reports,
      hasMore: snapshot.docs.length === parseInt(limit),
      nextPageToken: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get reports'
    });
  }
});

/**
 * PUT /api/admin/reports/:id/status
 * Update report status
 */
router.put('/reports/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    
    if (!['pending', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid status'
      });
    }

    const db = getFirestore();
    const reportRef = db.collection('reports').doc(id);
    const reportDoc = await reportRef.get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Report not found'
      });
    }

    await reportRef.update({
      status,
      resolution: resolution || null,
      resolvedBy: req.user.uid,
      resolvedAt: new Date(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Report status updated'
    });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update report status'
    });
  }
});

/**
 * POST /api/admin/categories
 * Create a new category
 */
router.post('/categories', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Category name is required'
      });
    }

    const category = await categoryService.createCategory({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#6B7280'
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Create category error:', error);
    
    if (error.message === 'Category with this name already exists') {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create category'
    });
  }
});

/**
 * PUT /api/admin/categories/:id
 * Update a category
 */
router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const category = await categoryService.updateCategory(id, updateData);

    res.json({
      success: true,
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.message === 'Category not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error.message === 'Category with this name already exists') {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update category'
    });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Delete a category
 */
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await categoryService.deleteCategory(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.message === 'Category not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error.message === 'Cannot delete category with existing posts') {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete category'
    });
  }
});

module.exports = router;
