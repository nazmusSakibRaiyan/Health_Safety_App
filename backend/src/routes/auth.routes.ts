import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  enable2FA,
  verify2FA,
  disable2FA,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback
} from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Local authentication
router.post('/register', register);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/refresh-token', refreshToken);

// Email verification
router.get('/verify-email/:token', verifyEmail);

// Password reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// 2FA routes
router.post('/2fa/enable', authenticateToken, enable2FA);
router.post('/2fa/verify', authenticateToken, verify2FA);
router.post('/2fa/disable', authenticateToken, disable2FA);

// OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.get('/facebook', facebookAuth);
router.get('/facebook/callback', facebookCallback);

export default router;
