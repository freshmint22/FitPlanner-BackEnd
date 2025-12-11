import { Router } from 'express';
import { listClasses, createReservation } from '../controllers/classes.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', listClasses);

// create a reservation for a class
router.post('/:classId/reservations', requireAuth, createReservation);

export default router;
