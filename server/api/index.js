const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Import your existing routes with correct paths
const path = require('path');
const authRoutes = require(path.join(__dirname, '../routes/auth'));
const postRoutes = require(path.join(__dirname, '../routes/posts'));
const adminRoutes = require(path.join(__dirname, '../routes/admin'));
const reportRoutes = require(path.join(__dirname, '../routes/reports'));

// Initialize Firebase once
const { initializeFirebase } = require(path.join(__dirname, '../config/firebase'));

let firebaseInitialized = false;
if (!firebaseInitialized) {
  try {
    initializeFirebase();
    firebaseInitialized = true;
    console.log('🔥 Firebase initialized for serverless function');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
}

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/report', reportRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Environment check
app.get('/api/env-check', (req, res) => {
  res.json({
    status: 'Environment Check',
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    corsOrigin: process.env.CORS_ORIGIN,
    hasFirebaseAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    hasFirebaseUrl: !!process.env.FIREBASE_DATABASE_URL,
    rateLimitWindow: process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMax: process.env.RATE_LIMIT_MAX_REQUESTS,
    rateLimitPost: process.env.RATE_LIMIT_POST_MAX
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'ArgueIt API Server', 
    status: 'Running',
    endpoints: ['/api/health', '/api/auth', '/api/posts', '/api/admin', '/api/report']
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: 'The requested resource was not found',
    path: req.originalUrl
  });
});

// Export for Vercel
module.exports = app;
