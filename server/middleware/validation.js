const Joi = require('joi');

/**
 * Generic validation middleware factory
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    console.log(`Validating ${property}:`, req[property]);
    
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      console.log('Validation error:', {
        originalData: req[property],
        validatedValue: value,
        errors: details
      });

      return res.status(400).json({
        error: 'Validation Error',
        details
      });
    }

    console.log(`Validation passed for ${property}:`, value);
    req[property] = value;
    next();
  };
};

// Post validation schemas
const createPostSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(100)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  
  body: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Body cannot exceed 500 characters'
    }),

  tags: Joi.array()
    .items(Joi.string().max(30))
    .min(1)
    .max(1)
    .required()
    .messages({
      'array.min': 'At least one tag is required',
      'array.max': 'Only one tag is allowed per post',
      'any.required': 'Tags are required'
    }),

  isAnonymous: Joi.boolean()
    .optional()
    .default(false)
});

const voteSchema = Joi.object({
  vote: Joi.string()
    .valid('yes', 'no')
    .required()
    .messages({
      'any.only': 'Vote must be either "yes" or "no"',
      'any.required': 'Vote is required'
    })
});

// Query validation schemas
const postsQuerySchema = Joi.object({
  mode: Joi.string()
    .valid('date', 'attraction', 'controversy')
    .default('date'),
  timeWindow: Joi.string()
    .valid('24h', '7d', '30d', 'all')
    .default('all'),
  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(20),
  pageToken: Joi.string().optional(),
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
});

// Report validation schema
const reportSchema = Joi.object({
  type: Joi.string()
    .valid('post', 'user')
    .required(),
  targetId: Joi.string()
    .required(),
  reason: Joi.string()
    .valid('spam', 'harassment', 'inappropriate', 'misinformation', 'other')
    .required(),
  description: Joi.string()
    .max(500)
    .optional()
});

// User registration schema
const registerUserSchema = Joi.object({
  displayName: Joi.string()
    .min(2)
    .max(50)
    .optional()
});

// User update schema
const updateUserSchema = Joi.object({
  displayName: Joi.string()
    .min(2)
    .max(50)
    .optional(),
  avatarURL: Joi.string()
    .uri()
    .allow('')
    .optional()
});

// Admin schemas
const banUserSchema = Joi.object({
  reason: Joi.string()
    .max(500)
    .required()
});

const deletePostSchema = Joi.object({
  reason: Joi.string()
    .max(500)
    .optional()
});

// Rate limiting validation
const rateLimitCheck = (maxPosts = 5, windowMs = 60 * 60 * 1000) => {
  const userPostCounts = new Map();

  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.uid;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    for (const [uid, posts] of userPostCounts.entries()) {
      userPostCounts.set(uid, posts.filter(timestamp => timestamp > windowStart));
      if (userPostCounts.get(uid).length === 0) {
        userPostCounts.delete(uid);
      }
    }

    // Check current user's post count
    const userPosts = userPostCounts.get(userId) || [];
    const recentPosts = userPosts.filter(timestamp => timestamp > windowStart);

    if (recentPosts.length >= maxPosts) {
      return res.status(429).json({
        error: 'Rate Limit Exceeded',
        message: `Maximum ${maxPosts} posts allowed per hour`,
        retryAfter: Math.ceil((recentPosts[0] + windowMs - now) / 1000)
      });
    }

    // Add current timestamp
    recentPosts.push(now);
    userPostCounts.set(userId, recentPosts);

    next();
  };
};

module.exports = {
  validate,
  createPostSchema,
  voteSchema,
  postsQuerySchema,
  reportSchema,
  registerUserSchema,
  updateUserSchema,
  banUserSchema,
  deletePostSchema,
  rateLimitCheck
};
