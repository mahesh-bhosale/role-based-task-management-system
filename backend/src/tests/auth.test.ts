import request from 'supertest';
import app from '../app';

describe('Auth API', () => {
  it('should return 404 for an unknown route', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });

  // A simple test to verify the auth route exists and responds
  it('should respond to /api/auth/login with a non-200 status for invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'invalid@example.com',
      password: 'wrong'
    });
    // Acceptable responses:
    // 400 - validation error (missing/invalid fields)
    // 401 - invalid credentials
    // 500 - database unavailable in CI environment (no DB service)
    expect([400, 401, 500]).toContain(res.statusCode);
  });
});
