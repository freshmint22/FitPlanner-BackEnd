import { Router } from 'express';
import { listRoutines, getRoutine, assignRoutine, listAssignedRoutines, getRoutineExercisesForUser, markExerciseCompleted, createRoutine } from '../controllers/routines.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Create routine (AI)
router.post('/', requireAuth, createRoutine);

// User endpoints (static routes before param)
router.get('/assigned/me', requireAuth, listAssignedRoutines);
router.get('/:id/exercises', requireAuth, getRoutineExercisesForUser);
router.put('/:id/exercises/:idx/complete', requireAuth, markExerciseCompleted);

// Public list
router.get('/', listRoutines);

// Routine by id and assign
router.get('/:id', requireAuth, getRoutine);
router.post('/:id/assign', requireAuth, assignRoutine);

export default router;
