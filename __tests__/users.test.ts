import request from 'supertest';
import app from '../src/app';
import { createTestToken, seededUser } from '../src/__tests__/jest.setup';

describe('Users Endpoints', () => {
  it('should get user profile', async () => {
    const token = createTestToken(seededUser);
    const response = await request(app)
      .get('/users/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('email');
  });
});