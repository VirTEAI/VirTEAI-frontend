import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { createSession, getSessionByCode, getLatestSession } from '../controllers/sessions.controller.js';

const router = Router();

router.use(requireAuth);
// Qualquer pessoa autenticada pode "reportar" uma sessão — simula o
// dispositivo VR, mesmo critério do POST /api/codes/validate.
router.post('/', createSession);
router.get('/latest', getLatestSession);
router.get('/by-code/:code', getSessionByCode);

export default router;
