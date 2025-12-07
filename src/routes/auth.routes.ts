import { Router } from 'express';

const router = Router();

router.post('/register', (_req, res) => {
  // Minimal mock: pretend registration succeeded and return a token
  res.status(201).json({ token: 'fake-jwt-token' });
});

router.post('/login', (_req, res) => {
  // Minimal mock: pretend login succeeded and return a token
  res.status(200).json({ token: 'fake-jwt-token' });
});

export default router;
