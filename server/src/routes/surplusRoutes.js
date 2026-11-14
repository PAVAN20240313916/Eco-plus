import { Router } from 'express';
import { getSurplusListings, createSurplusListing, updateSurplusStatus } from '../controllers/surplusController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { surplusSchema } from '../validation/schemas.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getSurplusListings);
router.post('/', validateBody(surplusSchema), createSurplusListing);
router.patch('/:id/status', updateSurplusStatus);

export default router;
