import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { createCode, listCodes, validateCode } from '../controllers/codes.controller.js';

const router = Router();

router.use(requireAuth);
router.post('/', requireRole('terapeuta', 'admin'), createCode);
router.get('/', requireRole('terapeuta', 'admin'), listCodes);
// Qualquer pessoa autenticada pode "validar" (simula o dispositivo VR lendo
// o código, não necessariamente logado como terapeuta/admin/paciente).
router.post('/validate', validateCode);

export default router;
