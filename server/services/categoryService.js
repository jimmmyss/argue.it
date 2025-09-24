const { getFirestore } = require('../config/firebase');

class CategoryService {
  constructor() {
    try {
      this.db = getFirestore();
    } catch (error) {
      console.warn('CategoryService: Firebase not available, running in demo mode');
      this.db = null;
    }
  }

  /**
   * Get all categories
   */
  async getAllCategories() {
    try {
      if (!this.db) {
        // Return mock categories for demo mode
        return [
          { id: '1', name: 'Politics', slug: 'politics', description: 'Political discussions', color: '#DC2626', postCount: 0 },
          { id: '2', name: 'Technology', slug: 'technology', description: 'Tech discussions', color: '#2563EB', postCount: 0 },
          { id: '3', name: 'Society', slug: 'society', description: 'Social issues', color: '#6B7280', postCount: 0 }
        ];
      }

      const snapshot = await this.db.collection('categories')
        .orderBy('name')
        .get();

      const categories = [];
      snapshot.forEach(doc => {
        categories.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw new Error('Failed to get categories');
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId) {
    try {
      const categoryDoc = await this.db.collection('categories').doc(categoryId).get();
      
      if (!categoryDoc.exists) {
        return null;
      }

      return {
        id: categoryDoc.id,
        ...categoryDoc.data()
      };
    } catch (error) {
      console.error('Error getting category:', error);
      throw new Error('Failed to get category');
    }
  }

  /**
   * Create a new category (admin only)
   */
  async createCategory(categoryData) {
    try {
      const { name, description, color } = categoryData;
      
      // Generate slug from name
      const slug = name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingSnapshot = await this.db.collection('categories')
        .where('slug', '==', slug)
        .get();

      if (!existingSnapshot.empty) {
        throw new Error('Category with this name already exists');
      }

      const category = {
        name,
        slug,
        description: description || '',
        color: color || '#6B7280',
        postCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await this.db.collection('categories').add(category);
      
      return {
        id: docRef.id,
        ...category
      };
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  /**
   * Update category (admin only)
   */
  async updateCategory(categoryId, updateData) {
    try {
      const categoryRef = this.db.collection('categories').doc(categoryId);
      const categoryDoc = await categoryRef.get();
      
      if (!categoryDoc.exists) {
        throw new Error('Category not found');
      }

      const allowedFields = ['name', 'description', 'color'];
      const updates = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      }

      // Update slug if name changed
      if (updateData.name) {
        const newSlug = updateData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Check if new slug conflicts with existing categories
        const existingSnapshot = await this.db.collection('categories')
          .where('slug', '==', newSlug)
          .get();

        const hasConflict = existingSnapshot.docs.some(doc => doc.id !== categoryId);
        
        if (hasConflict) {
          throw new Error('Category with this name already exists');
        }

        updates.slug = newSlug;
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No valid fields to update');
      }

      updates.updatedAt = new Date();

      await categoryRef.update(updates);

      const updatedDoc = await categoryRef.get();
      return {
        id: categoryDoc.id,
        ...updatedDoc.data()
      };
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  /**
   * Delete category (admin only)
   */
  async deleteCategory(categoryId) {
    try {
      const categoryRef = this.db.collection('categories').doc(categoryId);
      const categoryDoc = await categoryRef.get();
      
      if (!categoryDoc.exists) {
        throw new Error('Category not found');
      }

      // Check if category has posts
      const postsSnapshot = await this.db.collection('posts')
        .where('categoryId', '==', categoryId)
        .where('isDeleted', '==', false)
        .limit(1)
        .get();

      if (!postsSnapshot.empty) {
        throw new Error('Cannot delete category with existing posts');
      }

      await categoryRef.delete();
      return { success: true };
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(categoryId) {
    try {
      const categoryDoc = await this.db.collection('categories').doc(categoryId).get();
      
      if (!categoryDoc.exists) {
        throw new Error('Category not found');
      }

      // Get post count
      const postsSnapshot = await this.db.collection('posts')
        .where('categoryId', '==', categoryId)
        .where('isDeleted', '==', false)
        .get();

      // Get total votes in this category
      let totalVotes = 0;
      postsSnapshot.forEach(doc => {
        const postData = doc.data();
        totalVotes += postData.voteCount || 0;
      });

      return {
        postCount: postsSnapshot.size,
        totalVotes,
        averageVotesPerPost: postsSnapshot.size > 0 ? Math.round(totalVotes / postsSnapshot.size) : 0
      };
    } catch (error) {
      console.error('Error getting category stats:', error);
      throw new Error('Failed to get category statistics');
    }
  }

  /**
   * Update category post count (called when posts are created/deleted)
   */
  async updateCategoryPostCount(categoryId, increment = true) {
    try {
      const categoryRef = this.db.collection('categories').doc(categoryId);
      
      await categoryRef.update({
        postCount: increment 
          ? this.db.FieldValue.increment(1)
          : this.db.FieldValue.increment(-1),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating category post count:', error);
      // Don't throw error as this is a background operation
    }
  }

  /**
   * Initialize default categories
   */
  async initializeDefaultCategories() {
    try {
      const defaultCategories = [
        {
          name: 'Politics',
          description: 'Political discussions and debates',
          color: '#DC2626'
        },
        {
          name: 'Relationships',
          description: 'Dating, marriage, and relationship topics',
          color: '#EC4899'
        },
        {
          name: 'Technology',
          description: 'Tech trends, gadgets, and digital life',
          color: '#2563EB'
        },
        {
          name: 'Ethics',
          description: 'Moral and ethical dilemmas',
          color: '#7C3AED'
        },
        {
          name: 'Entertainment',
          description: 'Movies, TV, music, and pop culture',
          color: '#F59E0B'
        },
        {
          name: 'Lifestyle',
          description: 'Health, fitness, and life choices',
          color: '#10B981'
        },
        {
          name: 'Society',
          description: 'Social issues and cultural topics',
          color: '#6B7280'
        }
      ];

      const batch = this.db.batch();
      
      for (const categoryData of defaultCategories) {
        const slug = categoryData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Check if category already exists
        const existingSnapshot = await this.db.collection('categories')
          .where('slug', '==', slug)
          .get();

        if (existingSnapshot.empty) {
          const categoryRef = this.db.collection('categories').doc();
          batch.set(categoryRef, {
            ...categoryData,
            slug,
            postCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      await batch.commit();
      console.log('Default categories initialized');
    } catch (error) {
      console.error('Error initializing default categories:', error);
      throw new Error('Failed to initialize default categories');
    }
  }
}

module.exports = new CategoryService();
