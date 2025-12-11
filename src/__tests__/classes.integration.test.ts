import request from 'supertest';
import app from '../app';

describe('Classes routes (integration)', () => {
  it('GET /classes should return 200 and items array', async () => {
    const res = await request(app).get('/classes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('POST /classes/:classId/reservations without auth returns 401', async () => {
    const res = await request(app).post('/classes/123/reservations').send({ memberId: 'abc' });
    expect(res.status).toBe(401);
  });
});
