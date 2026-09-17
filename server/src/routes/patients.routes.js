import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/require-auth.js';
import { listPatients } from '../controllers/patients.controller.js';

const router = Router();

router.get('/', requireAuth, requireRole('terapeuta', 'admin'), listPatients);

export default router;
