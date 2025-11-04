import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  getPreferences,
  updatePreferences,
  scheduleReminder
} from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/schedule', scheduleReminder);

export default router;
