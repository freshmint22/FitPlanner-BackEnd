import { Router } from 'express';
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember
} from '../controllers/members.controller';

import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, getMembers);
router.post('/', requireAuth, createMember);
router.put('/:id', requireAuth, updateMember);
router.delete('/:id', requireAuth, deleteMember);

export default router;

