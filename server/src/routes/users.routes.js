import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { listUsers, getUser, updateUser, deleteUser } from '../controllers/users.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole('admin'), listUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.delete('/:id', requireRole('admin'), deleteUser);

export default router;
