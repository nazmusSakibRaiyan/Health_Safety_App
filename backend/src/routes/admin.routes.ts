import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  activateUser,
  getAuditLogs,
  getSystemStats
} from '../controllers/admin.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRole('admin', 'moderator'));

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', authorizeRole('admin'), updateUserRole);
router.put('/users/:id/deactivate', deactivateUser);
router.put('/users/:id/activate', activateUser);
router.get('/audit-logs', getAuditLogs);
router.get('/stats', getSystemStats);

export default router;
