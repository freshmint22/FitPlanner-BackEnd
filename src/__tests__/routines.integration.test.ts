import request from 'supertest';
import app from '../app';

jest.setTimeout(30000);

describe('Routines routes (integration)', () => {
  it('GET /routines should return 200 and items array', async () => {
    const res = await request(app).get('/routines');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});
