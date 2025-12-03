import request from 'supertest';
import app from '../src/app';

describe('Routines Endpoints', () => {
  it('should get routines', async () => {
    const response = await request(app)
      .get('/routines')
      .set('Authorization', 'Bearer token');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});