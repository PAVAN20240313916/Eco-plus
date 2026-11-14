import { Router } from 'express';
import { getForecast, matchSurplus, getAIHistory } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.post('/forecast', getForecast);
router.post('/surplus-match', matchSurplus);
router.get('/history', getAIHistory);

export default router;
