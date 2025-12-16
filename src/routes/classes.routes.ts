import { Router } from 'express';
import { listClasses, createReservation, cancelReservation, createClass, getReservationsByClass, listUpcomingClasses, getClassById, updateClass, deleteClass, getMyReservations } from '../controllers/classes.controller';
import { requireAuth, isAdmin } from '../middleware/auth';

const router = Router();


router.get('/', listClasses);
router.get('/upcoming', listUpcomingClasses);

// admin: create class
router.post('/', requireAuth, isAdmin, createClass);

// user's own reservations
router.get('/reservations/me', requireAuth, getMyReservations);

// list reservations for a class (admin)
router.get('/:classId/reservations', requireAuth, isAdmin, getReservationsByClass);

// create a reservation for a class (authenticated member)
router.post('/:classId/reservations', requireAuth, createReservation);
// cancel reservation for a class (authenticated member)
router.delete('/:classId/reservations', requireAuth, cancelReservation);

// class CRUD by id (admin)
router.get('/:id', getClassById);
router.put('/:id', requireAuth, isAdmin, updateClass);
router.delete('/:id', requireAuth, isAdmin, deleteClass);

export default router;
