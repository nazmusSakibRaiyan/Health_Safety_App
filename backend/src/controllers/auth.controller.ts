import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '../config/database';
import { sendEmail } from '../services/email.service';
import { body, validationResult } from 'express-validator';

// Register new user
export const register = [
  // Validation
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('fullName').trim().isLength({ min: 2 }),
  
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName, age, height, weight, gender } = req.body;

      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Generate email verification token
      const verificationToken = uuidv4();

      // Insert user
      const result = await pool.query(
        `INSERT INTO users (
          email, password_hash, full_name, age, height, weight, gender, 
          oauth_provider, email_verification_token
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id, email, full_name, created_at`,
        [email, passwordHash, fullName, age, height, weight, gender, 'local', verificationToken]
      );

      const user = result.rows[0];

      // Create default notification preferences
      await pool.query(
        'INSERT INTO notification_preferences (user_id) VALUES ($1)',
        [user.id]
      );

      // Send verification email
      await sendEmail({
        to: email,
        subject: 'Verify your email',
        html: `
          <h1>Welcome to Health Tracking!</h1>
          <p>Please verify your email by clicking the link below:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email/${verificationToken}">
            Verify Email
          </a>
        `
      });

      // Log audit
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [user.id, 'register', { method: 'local' }]
      );

      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
];

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Get user
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, role, is_active, 
              is_2fa_enabled, two_factor_secret, is_email_verified 
       FROM users WHERE email = $1 AND oauth_provider = 'local'`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA
    if (user.is_2fa_enabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ requires2FA: true });
      }

      const isValid = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: twoFactorCode
      });

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [user.id, 'login', req.ip, req.headers['user-agent']]
    );

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isEmailVerified: user.is_email_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
        [refreshToken]
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'refresh_secret'
    ) as any;

    // Check if token exists and is not revoked
    const result = await pool.query(
      `SELECT rt.*, u.email, u.role 
       FROM refresh_tokens rt 
       JOIN users u ON rt.user_id = u.id 
       WHERE rt.token = $1 AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const tokenData = result.rows[0];

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: tokenData.user_id, email: tokenData.email, role: tokenData.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid refresh token' });
  }
};

// Verify email
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      'UPDATE users SET is_email_verified = TRUE, email_verification_token = NULL WHERE email_verification_token = $1 RETURNING id',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

// Forgot password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const resetToken = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hour expiry

    await pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3',
      [resetToken, expires, email]
    );

    await sendEmail({
      to: email,
      subject: 'Password Reset',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">
          Reset Password
        </a>
        <p>This link expires in 1 hour.</p>
      `
    });

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const result = await pool.query(
      'SELECT id FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE password_reset_token = $2',
      [passwordHash, token]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
};

// Enable 2FA
export const enable2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const secret = speakeasy.generateSecret({
      name: `Health Tracking (${req.user?.email})`
    });

    await pool.query(
      'UPDATE users SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
};

// Verify 2FA
export const verify2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { token } = req.body;

    const result = await pool.query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId]
    );

    const secret = result.rows[0]?.two_factor_secret;

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await pool.query(
      'UPDATE users SET is_2fa_enabled = TRUE WHERE id = $1',
      [userId]
    );

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
};

// Disable 2FA
export const disable2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const isValid = await bcrypt.compare(password, result.rows[0].password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await pool.query(
      'UPDATE users SET is_2fa_enabled = FALSE, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

// OAuth - Google (Placeholder - requires OAuth setup)
export const googleAuth = (req: Request, res: Response) => {
  // Redirect to Google OAuth URL
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=profile email`);
};

export const googleCallback = async (req: Request, res: Response) => {
  // Handle Google OAuth callback
  res.json({ message: 'Google OAuth implementation needed' });
};

// OAuth - Facebook (Placeholder)
export const facebookAuth = (req: Request, res: Response) => {
  res.json({ message: 'Facebook OAuth implementation needed' });
};

export const facebookCallback = async (req: Request, res: Response) => {
  res.json({ message: 'Facebook OAuth implementation needed' });
};
