import { Router } from 'express';
import { getWasteLogs, addWasteLog, deleteWasteLog } from '../controllers/wasteController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { wasteLogSchema } from '../validation/schemas.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getWasteLogs);
router.post('/', validateBody(wasteLogSchema), addWasteLog);
router.delete('/:id', deleteWasteLog);

export default router;
