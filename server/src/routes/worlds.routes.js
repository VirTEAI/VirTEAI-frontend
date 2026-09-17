import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { uploadWorldImages } from '../middleware/upload.js';
import { listWorlds, getWorld, createWorld, updateWorld } from '../controllers/worlds.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', listWorlds);
router.get('/:id', getWorld);
router.post('/', requireRole('admin'), uploadWorldImages, createWorld);
router.patch('/:id', requireRole('admin'), uploadWorldImages, updateWorld);

export default router;
