const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { validate, updateUserSchema, registerUserSchema } = require('../middleware/validation');
const userService = require('../services/userService');

const router = express.Router();

/**
 * POST /api/auth/token
 * Validate token and return user info
 */
router.post('/token', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    console.log('Token validation for user:', { uid, name: req.user.name, email: req.user.email });
    
    // Simply validate token - don't create or fetch user data
    // This endpoint should only confirm the token is valid
    res.json({
      success: true,
      message: 'Token is valid',
      uid: uid
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to validate token'
    });
  }
});

/**
 * GET /api/auth/profile
 * Get current user profile
 */
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { uid, name } = req.user;
    
    console.log('=== PROFILE REQUEST ===');
    console.log('Getting profile for UID:', uid);
    console.log('Token displayName:', name);
    
    // First try to fix the display name if it's wrong
    let user = await userService.fixUserDisplayName(uid, name);
    
    if (!user) {
      // If fix didn't work, try regular get
      user = await userService.getUserByUid(uid);
    }
    
    if (!user) {
      console.log('User not found in database');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User profile not found'
      });
    }

    console.log('Found user in database:');
    console.log('- DisplayName:', user.displayName);
    console.log('- Email:', user.email);

    // Get user statistics
    const stats = await userService.getUserStats(uid);

    const responseUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      avatarURL: user.avatarURL,
      role: user.role,
      isBanned: user.isBanned,
      createdAt: user.createdAt,
      ...stats
    };

    console.log('Sending profile response with displayName:', responseUser.displayName);

    res.json({
      success: true,
      user: responseUser
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user profile'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', verifyToken, validate(updateUserSchema), async (req, res) => {
  try {
    const { uid } = req.user;
    
    console.log('Profile update request:', {
      uid,
      body: req.body,
      bodyKeys: Object.keys(req.body)
    });
    
    const updatedUser = await userService.updateProfile(uid, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        avatarURL: updatedUser.avatarURL,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }
    
    if (error.message === 'No valid fields to update') {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update profile'
    });
  }
});

/**
 * DELETE /api/auth/account
 * Delete user account
 */
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    
    await userService.deleteAccount(uid);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).json({
        error: 'Not Found',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete account'
    });
  }
});

/**
 * POST /api/auth/register
 * Register/sync user after Firebase Auth registration
 */
router.post('/register', verifyToken, validate(registerUserSchema), async (req, res) => {
  try {
    const { uid, email, picture } = req.user;
    const { displayName: requestDisplayName } = req.body;
    
    console.log('=== REGISTRATION START ===');
    console.log('User ID:', uid);
    console.log('Email:', email);
    console.log('Request body displayName:', requestDisplayName);
    console.log('Request body type:', typeof requestDisplayName);
    console.log('Full request body:', req.body);
    
    // Check if user already exists - if so, return error
    const existingUser = await userService.getUserByUid(uid);
    if (existingUser) {
      console.log('User already exists:', existingUser.displayName);
      return res.status(409).json({
        error: 'Conflict',
        message: 'User already registered',
        user: {
          uid: existingUser.uid,
          email: existingUser.email,
          displayName: existingUser.displayName,
          avatarURL: existingUser.avatarURL,
          role: existingUser.role,
          createdAt: existingUser.createdAt
        }
      });
    }
    
    // Use displayName from request body - ignore token completely for display name
    const displayName = requestDisplayName && requestDisplayName.trim() ? requestDisplayName.trim() : 'TestUser';
    
    console.log('FINAL displayName that will be saved:', displayName);
    console.log('=== CREATING USER ===');
    
    // Create new user profile
    const user = await userService.createOrUpdateUser(uid, {
      email,
      displayName,
      avatarURL: picture || null
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatarURL: user.avatarURL,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to register user'
    });
  }
});

module.exports = router;
