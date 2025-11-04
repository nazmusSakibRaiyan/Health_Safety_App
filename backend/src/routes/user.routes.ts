import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updateHealthData,
  deleteAccount,
  exportData
} from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/health-data', updateHealthData);
router.delete('/account', deleteAccount);
router.post('/export-data', exportData);

export default router;
