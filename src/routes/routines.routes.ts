import { Router } from 'express';
import { listRoutines, getRoutine, assignRoutine, listAssignedRoutines, getRoutineExercisesForUser, markExerciseCompleted } from '../controllers/routines.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', listRoutines);
router.get('/:id', requireAuth, getRoutine);

// Assign a routine to a member (admin/trainer)
router.post('/:id/assign', requireAuth, assignRoutine);

// User endpoints
router.get('/assigned/me', requireAuth, listAssignedRoutines);
router.get('/:id/exercises', requireAuth, getRoutineExercisesForUser);
router.put('/:id/exercises/:idx/complete', requireAuth, markExerciseCompleted);
export default router;
