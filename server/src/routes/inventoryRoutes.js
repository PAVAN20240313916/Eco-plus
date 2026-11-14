import { Router } from 'express';
import { getInventory, addInventory, updateInventory, deleteInventory } from '../controllers/inventoryController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { inventorySchema } from '../validation/schemas.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getInventory);
router.post('/', validateBody(inventorySchema), addInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;
