import { Router } from 'express';
import { generateRoutine, generateRestrictionAdvice } from '../controllers/ai.controller';

const router = Router();

// POST /api/ai/generate-routine
router.post('/generate-routine', generateRoutine);
// POST /api/ai/restriction-advice
router.post('/restriction-advice', generateRestrictionAdvice);

export default router;
