const { getFirestore, getAuth } = require('../config/firebase');

class UserService {
  constructor() {
    try {
      this.db = getFirestore();
      this.auth = getAuth();
    } catch (error) {
      console.warn('UserService: Firebase not available, running in demo mode');
      this.db = null;
      this.auth = null;
    }
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateUser(uid, userData) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      const now = new Date();
      
      if (userDoc.exists) {
        // Update existing user
        await userRef.update({
          ...userData,
          updatedAt: now
        });
        
        const updatedDoc = await userRef.get();
        return {
          uid,
          ...updatedDoc.data()
        };
      } else {
        // Create new user
        const newUser = {
          ...userData,
          role: 'user',
          isBanned: false,
          createdAt: now,
          updatedAt: now,
          postCount: 0,
          voteCount: 0
        };
        
        await userRef.set(newUser);
        
        return {
          uid,
          ...newUser
        };
      }
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw new Error('Failed to create or update user');
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid) {
    try {
      const userDoc = await this.db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return {
        uid,
        ...userData,
        createdAt: userData.createdAt?.toDate(),
        updatedAt: userData.updatedAt?.toDate()
      };
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error('Failed to get user');
    }
  }

  /**
   * Ban a user
   */
  async banUser(uid, reason, bannedBy) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      await userRef.update({
        isBanned: true,
        bannedAt: new Date(),
        bannedBy,
        banReason: reason,
        updatedAt: new Date()
      });

      // Revoke all refresh tokens to force logout
      try {
        await this.auth.revokeRefreshTokens(uid);
      } catch (authError) {
        console.error('Error revoking tokens:', authError);
        // Continue even if token revocation fails
      }

      return { success: true };
    } catch (error) {
      console.error('Error banning user:', error);
      throw new Error('Failed to ban user');
    }
  }

  /**
   * Unban a user
   */
  async unbanUser(uid, unbannedBy) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      await userRef.update({
        isBanned: false,
        unbannedAt: new Date(),
        unbannedBy,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw new Error('Failed to unban user');
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(uid, role, updatedBy) {
    try {
      const validRoles = ['user', 'admin'];
      if (!validRoles.includes(role)) {
        throw new Error('Invalid role');
      }

      const userRef = this.db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      await userRef.update({
        role,
        roleUpdatedAt: new Date(),
        roleUpdatedBy: updatedBy,
        updatedAt: new Date()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(uid) {
    try {
      const userDoc = await this.db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      
      // Get post count
      const postsSnapshot = await this.db.collection('posts')
        .where('authorUid', '==', uid)
        .where('isDeleted', '==', false)
        .get();
      
      // Get vote count
      const votesSnapshot = await this.db.collection('votes')
        .where('userUid', '==', uid)
        .get();

      return {
        postCount: postsSnapshot.size,
        voteCount: votesSnapshot.size,
        joinDate: userData.createdAt?.toDate(),
        role: userData.role,
        isBanned: userData.isBanned
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }


  /**
   * Get all users (admin only, paginated)
   */
  async getAllUsers(limit = 50, pageToken = null) {
    try {
      let query = this.db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (pageToken) {
        const lastDoc = await this.db.collection('users').doc(pageToken).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.get();
      const users = [];

      snapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          uid: doc.id,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          isBanned: userData.isBanned,
          createdAt: userData.createdAt?.toDate(),
          updatedAt: userData.updatedAt?.toDate(),
          postCount: userData.postCount || 0,
          voteCount: userData.voteCount || 0
        });
      });

      return {
        users,
        hasMore: snapshot.docs.length === limit,
        nextPageToken: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1].id : null
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Failed to get users');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(uid, profileData) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const allowedFields = ['displayName', 'avatarURL'];
      const updateData = {};
      
      for (const field of allowedFields) {
        if (profileData[field] !== undefined) {
          updateData[field] = profileData[field];
        }
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update');
      }

      updateData.updatedAt = new Date();

      await userRef.update(updateData);

      const updatedDoc = await userRef.get();
      return {
        uid,
        ...updatedDoc.data()
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(uid) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      // Soft delete user data
      await userRef.update({
        isDeleted: true,
        deletedAt: new Date(),
        email: `deleted_${uid}@deleted.com`,
        displayName: '[Deleted User]'
      });

      // Soft delete user's posts
      const postsSnapshot = await this.db.collection('posts')
        .where('authorUid', '==', uid)
        .get();

      const batch = this.db.batch();
      postsSnapshot.forEach(doc => {
        batch.update(doc.ref, {
          isDeleted: true,
          deletedAt: new Date()
        });
      });

      await batch.commit();

      // Delete from Firebase Auth
      try {
        await this.auth.deleteUser(uid);
      } catch (authError) {
        console.error('Error deleting from Firebase Auth:', authError);
        // Continue even if auth deletion fails
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }
}

module.exports = new UserService();
