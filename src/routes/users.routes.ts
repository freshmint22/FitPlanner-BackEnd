import { Router } from 'express';

const router = Router();

router.get('/profile', (_req, res) => {
  // Return a mocked profile for tests
  res.status(200).json({ email: 'test@example.com' });
});

export default router;
