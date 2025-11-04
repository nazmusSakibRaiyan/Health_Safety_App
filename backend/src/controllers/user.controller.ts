import { Request, Response } from 'express';
import pool from '../config/database';

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT id, email, full_name, age, height, weight, gender, 
              is_email_verified, is_2fa_enabled, role, created_at, last_login
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fullName, age, height, weight, gender } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           age = COALESCE($2, age),
           height = COALESCE($3, height),
           weight = COALESCE($4, weight),
           gender = COALESCE($5, gender)
       WHERE id = $6
       RETURNING id, email, full_name, age, height, weight, gender`,
      [fullName, age, height, weight, gender, userId]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'profile_update', { fields: Object.keys(req.body) }]
    );

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Update health data
export const updateHealthData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { age, height, weight, gender } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET age = $1, height = $2, weight = $3, gender = $4
       WHERE id = $5
       RETURNING age, height, weight, gender`,
      [age, height, weight, gender, userId]
    );

    res.json({
      message: 'Health data updated successfully',
      healthData: result.rows[0]
    });
  } catch (error) {
    console.error('Update health data error:', error);
    res.status(500).json({ error: 'Failed to update health data' });
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { password } = req.body;

    // Verify password
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(password, result.rows[0].password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user (cascade will delete related data)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

// Export user data
export const exportData = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { format } = req.body; // 'json', 'csv', 'pdf'

    // Create export request
    const result = await pool.query(
      `INSERT INTO data_export_requests (user_id, export_format, status)
       VALUES ($1, $2, 'pending')
       RETURNING id`,
      [userId, format || 'json']
    );

    // TODO: Implement actual export logic (background job)
    
    res.json({
      message: 'Export request created. You will receive a notification when ready.',
      requestId: result.rows[0].id
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Failed to create export request' });
  }
};
