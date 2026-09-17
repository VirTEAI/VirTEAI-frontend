import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { listUsers, getUser, updateUser } from '../controllers/users.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole('admin'), listUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser);

export default router;
