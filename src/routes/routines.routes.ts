import { Router } from 'express';
import { listRoutines, getRoutine } from '../controllers/routines.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', listRoutines);
router.get('/:id', requireAuth, getRoutine);

export default router;
import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json([]);
});

export default router;
