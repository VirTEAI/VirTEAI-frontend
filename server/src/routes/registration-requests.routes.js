import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import {
  listRegistrationRequests,
  approveRegistrationRequest,
  rejectRegistrationRequest,
} from '../controllers/registration-requests.controller.js';

const router = Router();

// Só admin revisa pedido de cadastro — terapeuta não participa dessa
// triagem (é justamente quem está pedindo, nos únicos casos que existem
// hoje).
router.use(requireAuth, requireRole('admin'));
router.get('/', listRegistrationRequests);
router.post('/:id/approve', approveRegistrationRequest);
router.post('/:id/reject', rejectRegistrationRequest);

export default router;
