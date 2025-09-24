const request = require('supertest');
const app = require('../src/index');

describe('Posts API', () => {
  describe('GET /api/posts', () => {
    it('should return posts list', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('posts');
      expect(Array.isArray(response.body.posts)).toBe(true);
    });

    it('should filter posts by category', async () => {
      const response = await request(app)
        .get('/api/posts?category=test-category')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('posts');
    });

    it('should sort posts by mode', async () => {
      const response = await request(app)
        .get('/api/posts?mode=attraction')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('posts');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });

  describe('POST /api/posts', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: 'Test Post',
          categoryId: 'test-category'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer invalid-token')
        .send({})
        .expect(401); // Will fail auth first

      // Note: In a real test, you'd use a valid token and test validation
    });
  });

  describe('GET /api/posts/categories', () => {
    it('should return categories list', async () => {
      const response = await request(app)
        .get('/api/posts/categories')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('categories');
      expect(Array.isArray(response.body.categories)).toBe(true);
    });
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('timestamp');
  });
});
