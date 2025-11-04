import { Request, Response } from 'express';
import pool from '../config/database';

// Get all notifications for user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    let query = `
      SELECT id, type, title, message, is_read, scheduled_for, sent_at, created_at
      FROM notifications
      WHERE user_id = $1
    `;
    
    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';

    const result = await pool.query(query, [userId, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 ${
        unreadOnly === 'true' ? 'AND is_read = FALSE' : ''
      }`,
      [userId]
    );

    res.json({
      notifications: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

// Get notification preferences
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const result = await pool.query(
      `SELECT * FROM notification_preferences WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default preferences if not exist
      await pool.query(
        'INSERT INTO notification_preferences (user_id) VALUES ($1)',
        [userId]
      );
      return res.json({ preferences: {} });
    }

    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
};

// Update notification preferences
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      pushEnabled,
      workoutReminders,
      mealReminders,
      hydrationReminders,
      sleepReminders,
      inAppEnabled,
      goalAchievements,
      weeklyReports,
      healthTips,
      emailEnabled,
      workoutReminderTime,
      mealReminderTimes,
      hydrationReminderInterval,
      sleepReminderTime
    } = req.body;

    const result = await pool.query(
      `UPDATE notification_preferences 
       SET push_enabled = COALESCE($1, push_enabled),
           workout_reminders = COALESCE($2, workout_reminders),
           meal_reminders = COALESCE($3, meal_reminders),
           hydration_reminders = COALESCE($4, hydration_reminders),
           sleep_reminders = COALESCE($5, sleep_reminders),
           in_app_enabled = COALESCE($6, in_app_enabled),
           goal_achievements = COALESCE($7, goal_achievements),
           weekly_reports = COALESCE($8, weekly_reports),
           health_tips = COALESCE($9, health_tips),
           email_enabled = COALESCE($10, email_enabled),
           workout_reminder_time = COALESCE($11, workout_reminder_time),
           meal_reminder_times = COALESCE($12, meal_reminder_times),
           hydration_reminder_interval = COALESCE($13, hydration_reminder_interval),
           sleep_reminder_time = COALESCE($14, sleep_reminder_time)
       WHERE user_id = $15
       RETURNING *`,
      [
        pushEnabled, workoutReminders, mealReminders, hydrationReminders,
        sleepReminders, inAppEnabled, goalAchievements, weeklyReports,
        healthTips, emailEnabled, workoutReminderTime,
        JSON.stringify(mealReminderTimes), hydrationReminderInterval,
        sleepReminderTime, userId
      ]
    );

    res.json({
      message: 'Preferences updated successfully',
      preferences: result.rows[0]
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Schedule a reminder
export const scheduleReminder = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { type, title, message, scheduledFor } = req.body;

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, scheduled_for)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, scheduledFor]
    );

    // TODO: Implement actual scheduling (using cron or background job)

    res.json({
      message: 'Reminder scheduled successfully',
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Schedule reminder error:', error);
    res.status(500).json({ error: 'Failed to schedule reminder' });
  }
};
