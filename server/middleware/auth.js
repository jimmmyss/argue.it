const { getAuth } = require('../config/firebase');

/**
 * Middleware to verify Firebase ID token
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided or invalid format' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'No token provided' 
      });
    }

    // Verify the token with Firebase Admin
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    console.log('Decoded token data:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      displayName: decodedToken.displayName,
      picture: decodedToken.picture
    });
    
    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name || decodedToken.displayName,
      picture: decodedToken.picture,
      role: decodedToken.role || 'user' // Default role
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Token expired' 
      });
    }
    
    if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Token revoked' 
      });
    }
    
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Invalid token' 
    });
  }
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Authentication required' 
      });
    }

    // Check user role in Firestore
    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();
    
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'User not found' 
      });
    }

    const userData = userDoc.data();
    
    if (userData.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Admin access required' 
      });
    }

    // Update user object with role from database
    req.user.role = userData.role;
    req.user.isBanned = userData.isBanned || false;

    if (req.user.isBanned) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'User is banned' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Failed to verify admin status' 
    });
  }
};

/**
 * Middleware to check if user is banned
 */
const checkBanned = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const { getFirestore } = require('../config/firebase');
    const db = getFirestore();
    
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      if (userData.isBanned) {
        return res.status(403).json({ 
          error: 'Forbidden', 
          message: 'User is banned' 
        });
      }
      
      // Update user object with database info
      req.user.role = userData.role || 'user';
      req.user.isBanned = userData.isBanned || false;
    }

    next();
  } catch (error) {
    console.error('Ban check error:', error);
    // Don't block request on error, just log it
    next();
  }
};

/**
 * Optional auth middleware - doesn't require authentication but adds user info if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return next();
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      name: decodedToken.name,
      picture: decodedToken.picture,
      role: decodedToken.role || 'user'
    };

    // Check if user is banned
    await checkBanned(req, res, next);
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  checkBanned,
  optionalAuth
};
