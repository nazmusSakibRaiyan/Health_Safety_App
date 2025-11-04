import { Request, Response } from 'express';
import pool from '../config/database';

// Get all users (with pagination)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT id, email, full_name, role, is_active, is_email_verified, 
             created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users WHERE 1=1 ${
      search ? `AND (email ILIKE '%${search}%' OR full_name ILIKE '%${search}%')` : ''
    } ${role ? `AND role = '${role}'` : ''}`;
    const countResult = await pool.query(countQuery);

    res.json({
      users: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, email, full_name, age, height, weight, gender, role, 
              is_active, is_email_verified, is_2fa_enabled, created_at, 
              last_login, oauth_provider
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2',
      [role, id]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user?.userId, 'role_update', { targetUserId: id, newRole: role }]
    );

    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

// Deactivate user
export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent self-deactivation
    if (id === req.user?.userId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    await pool.query(
      'UPDATE users SET is_active = FALSE WHERE id = $1',
      [id]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user?.userId, 'user_deactivated', { targetUserId: id }]
    );

    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

// Activate user
export const activateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE users SET is_active = TRUE WHERE id = $1',
      [id]
    );

    // Log audit
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user?.userId, 'user_activated', { targetUserId: id }]
    );

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
};

// Get audit logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, userId = '', action = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT al.*, u.email, u.full_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (action) {
      query += ` AND al.action = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ logs: result.rows });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

// Get system statistics
export const getSystemStats = async (req: Request, res: Response) => {
  try {
    // Total users
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    
    // Active users (logged in last 30 days)
    const activeUsers = await pool.query(
      "SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL '30 days'"
    );
    
    // New users (last 7 days)
    const newUsers = await pool.query(
      "SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'"
    );
    
    // Users by role
    const usersByRole = await pool.query(
      'SELECT role, COUNT(*) FROM users GROUP BY role'
    );
    
    // 2FA enabled users
    const twoFAEnabled = await pool.query(
      'SELECT COUNT(*) FROM users WHERE is_2fa_enabled = TRUE'
    );

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      activeUsers: parseInt(activeUsers.rows[0].count),
      newUsers: parseInt(newUsers.rows[0].count),
      usersByRole: usersByRole.rows,
      twoFAEnabled: parseInt(twoFAEnabled.rows[0].count)
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Failed to fetch system stats' });
  }
};
