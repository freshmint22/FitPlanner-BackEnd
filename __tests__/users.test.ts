import request from 'supertest';
import app from '../src/app';

describe('Users Endpoints', () => {
  it('should get user profile', async () => {
    const response = await request(app)
      .get('/users/profile')
      .set('Authorization', 'Bearer token'); // Mock token
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('email');
  });
});