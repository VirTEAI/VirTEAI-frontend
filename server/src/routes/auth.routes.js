import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/require-auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

export default router;
