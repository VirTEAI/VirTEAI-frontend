import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import {
  bulkDeleteCodes,
  createCode,
  deleteCode,
  listCodes,
  validateCode,
} from '../controllers/codes.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/', requireRole('terapeuta', 'admin'), createCode);
router.get('/', requireRole('terapeuta', 'admin'), listCodes);
// Qualquer pessoa autenticada pode "validar" (simula o dispositivo VR lendo
// o código, não necessariamente logado como terapeuta/admin/paciente).
router.post('/validate', validateCode);
// /bulk tem que vir antes de /:id, senão o Express casa "bulk" como se
// fosse um :id.
router.delete('/bulk', requireRole('terapeuta', 'admin'), bulkDeleteCodes);
router.delete('/:id', requireRole('terapeuta', 'admin'), deleteCode);

export default router;
