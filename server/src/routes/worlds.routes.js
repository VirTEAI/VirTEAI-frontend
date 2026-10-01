import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { uploadWorldImages } from '../middleware/upload.js';
import {
  listWorlds,
  getWorld,
  createWorld,
  updateWorld,
  deleteWorld,
} from '../controllers/worlds.controller.js';
import {
  listComments,
  createComment,
  deleteComment,
} from '../controllers/world-comments.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/', listWorlds);
router.get('/:id', getWorld);
router.post('/', requireRole('admin'), uploadWorldImages, createWorld);
router.patch('/:id', requireRole('admin'), uploadWorldImages, updateWorld);
router.delete('/:id', requireRole('admin'), deleteWorld);

router.get('/:worldId/comments', listComments);
router.post('/:worldId/comments', createComment);
router.delete('/:worldId/comments/:commentId', deleteComment);

export default router;
