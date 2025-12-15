import { Router } from 'express';
import { generateRoutine } from '../controllers/ai.controller';

const router = Router();

// POST /api/ai/generate-routine
router.post('/generate-routine', generateRoutine);

export default router;
