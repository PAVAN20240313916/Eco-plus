import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validation/schemas.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.get('/me', authenticateToken, getMe);

export default router;
